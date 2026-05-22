use lazy_static::lazy_static;
#[cfg(not(target_os = "android"))]
use netwatcher::{watch_interfaces, Interface, Update};
use regex::Regex;
use reqwest::blocking::Client;
#[cfg(not(target_os = "android"))]
use std::collections::HashMap;
#[cfg(not(target_os = "android"))]
use std::process::Command;
use std::sync::{Arc, Mutex, Once};
#[cfg(not(target_os = "android"))]
use std::thread;
use std::time::Duration;
use tauri::Emitter;

static MONITOR_ONCE: Once = Once::new();

lazy_static! {
    static ref LAST_STATE: Mutex<Option<WifiState>> = Mutex::new(None);
    static ref LAST_SYNC_NETWORK_STATE: Mutex<Option<SyncNetworkState>> = Mutex::new(None);
    static ref INTERFACE_NAME_REGEX: Regex = Regex::new(r"^[a-zA-Z0-9_\-\. ]+$")
        .expect("Regex de interfaz inválido");
    // Conservado para compatibilidad con get_current_network_status en Android
    static ref ANDROID_SSID: Mutex<Option<Box<str>>> = Mutex::new(None);
}

/// Actualiza el SSID en Android (llamado desde el frontend vía comando Tauri).
/// Con el observer activo este campo se actualiza directamente desde los eventos WiFi,
/// pero se mantiene para que get_network_status() tenga siempre el último SSID conocido.
pub fn update_android_ssid(ssid: Option<String>) {
    let new_ssid = ssid.as_deref().map(Box::from);
    let mut guard = match ANDROID_SSID.lock() {
        Ok(g) => g,
        Err(p) => p.into_inner(),
    };
    *guard = new_ssid;
}

const SSID_RETRY_DELAY_MS: u64 = 500;
#[cfg(not(target_os = "android"))]
const MAX_INTERFACE_NAME_LENGTH: usize = 64;
const CONNECTIVITY_TIMEOUT_SECS: u64 = 3;
const GENERATE_204_URL: &str = "http://clients3.google.com/generate_204";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum SyncNetworkState {
    FineConnection,
    HaveCautivePortal,
    InvalidConnection,
    MobileConnection,
    MobileConnectionRequiereAuth,
}

impl SyncNetworkState {
    fn as_key(self) -> &'static str {
        match self {
            SyncNetworkState::FineConnection => "fineConnection",
            SyncNetworkState::HaveCautivePortal => "haveCautivePortal",
            SyncNetworkState::InvalidConnection => "invalidConnection",
            SyncNetworkState::MobileConnection => "mobileConnection",
            SyncNetworkState::MobileConnectionRequiereAuth => "mobileConnectionRequiereAuth",
        }
    }

    fn as_status_text(self) -> &'static str {
        match self {
            SyncNetworkState::FineConnection => "WI-FI Cimarrón Autenticado",
            SyncNetworkState::HaveCautivePortal | SyncNetworkState::MobileConnectionRequiereAuth => {
                "Red UABC disponible, inicia sesión"
            }
            SyncNetworkState::InvalidConnection => "WI-FI Cimarrón No Disponible",
            SyncNetworkState::MobileConnection => "Sin conexión a la red de la universidad",
        }
    }
}

#[cfg(not(target_os = "android"))]
#[derive(Debug)]
enum InterfaceValidation {
    Valid(String),
    Invalid(String),
}

#[cfg(not(target_os = "android"))]
fn sanitize_interface_name(name: &str) -> InterfaceValidation {
    if name.len() > MAX_INTERFACE_NAME_LENGTH {
        return InterfaceValidation::Invalid(format!(
            "Nombre de interfaz demasiado largo: {} caracteres (máximo {})",
            name.len(),
            MAX_INTERFACE_NAME_LENGTH
        ));
    }

    if name.is_empty() {
        return InterfaceValidation::Invalid("Nombre de interfaz vacío".to_string());
    }

    if !INTERFACE_NAME_REGEX.is_match(name) {
        return InterfaceValidation::Invalid(format!(
            "Nombre de interfaz contiene caracteres no permitidos: {}",
            name
        ));
    }

    let dangerous_patterns = ["..", "//", "\\", "$", "`", "|", ";", "&", ">", "<", "(", ")", "{", "}", "[", "]", "'", "\"", "\n", "\r", "\0"];
    for pattern in dangerous_patterns {
        if name.contains(pattern) {
            return InterfaceValidation::Invalid(format!(
                "Nombre de interfaz contiene patrón peligroso: {}",
                pattern
            ));
        }
    }

    InterfaceValidation::Valid(name.to_string())
}

#[cfg(not(target_os = "android"))]
fn get_safe_interface_name(name: &str) -> Option<String> {
    match sanitize_interface_name(name) {
        InterfaceValidation::Valid(safe_name) => Some(safe_name),
        InterfaceValidation::Invalid(reason) => {
            eprintln!("[network-sync] Nombre de interfaz inválido: {}", reason);
            None
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct WifiState {
    interface: Box<str>,
    ssid: Option<Box<str>>,
    ipv4: Option<Box<str>>,
}

#[cfg(not(target_os = "android"))]
impl WifiState {
    fn from_interfaces(interfaces: &HashMap<u32, Interface>) -> Option<Self> {
        interfaces
            .values()
            .filter(|iface| !iface.ips.is_empty() && is_wifi_interface(&iface.name))
            .find_map(|iface| {
                let ipv4 = iface
                    .ips
                    .iter()
                    .map(|ip| ip.ip.to_string())
                    .find(|ip_str| {
                        !ip_str.starts_with("fe80:") && !ip_str.starts_with("169.254.")
                    })?;

                Some(WifiState {
                    interface: iface.name.clone().into_boxed_str(),
                    ssid: get_wifi_ssid(&iface.name).map(|s| s.into_boxed_str()),
                    ipv4: Some(ipv4.into_boxed_str()),
                })
            })
    }
}

#[inline]
fn check_is_uabc(ssid: Option<&str>) -> bool {
    ssid.map(|s| s.contains("UABC")).unwrap_or(false)
}

fn has_internet_access() -> bool {
    let client = match Client::builder()
        .timeout(Duration::from_secs(CONNECTIVITY_TIMEOUT_SECS))
        .build()
    {
        Ok(client) => client,
        Err(err) => {
            eprintln!("[network-sync] Error creando cliente HTTP para verificación: {err}");
            return false;
        }
    };

    match client.get(GENERATE_204_URL).send() {
        Ok(response) => response.status().as_u16() == 204,
        Err(err) => {
            eprintln!("[network-sync] Falló generate_204: {err}");
            false
        }
    }
}

fn resolve_sync_network_state(ssid: Option<&str>, connected: bool, is_uabc: bool) -> SyncNetworkState {
    let has_wifi = has_internet_access();

    if connected && is_uabc {
        if has_wifi {
            return SyncNetworkState::FineConnection;
        }
        return SyncNetworkState::HaveCautivePortal;
    }

    if !connected && has_wifi {
        return SyncNetworkState::MobileConnection;
    }

    if !connected && !has_wifi && ssid.map(|s| s.contains("UABC")).unwrap_or(false) {
        return SyncNetworkState::MobileConnectionRequiereAuth;
    }

    SyncNetworkState::InvalidConnection
}

fn log_state_transition(new_state: SyncNetworkState, ssid: Option<&str>, connected: bool, is_uabc: bool) {
    let mut guard = match LAST_SYNC_NETWORK_STATE.lock() {
        Ok(g) => g,
        Err(poisoned) => poisoned.into_inner(),
    };

    let previous = *guard;
    if previous != Some(new_state) {
        println!(
            "[network-sync] Estado: {:?} → {:?} | ssid={} | connected={} | is_uabc={}",
            previous,
            Some(new_state),
            ssid.unwrap_or("<none>"),
            connected,
            is_uabc,
        );
        *guard = Some(new_state);
    }
}

fn create_status_payload(ssid: Option<&str>) -> serde_json::Value {
    let is_uabc = check_is_uabc(ssid);
    let connected = ssid.is_some();
    let network_state = resolve_sync_network_state(ssid, connected, is_uabc);

    log_state_transition(network_state, ssid, connected, is_uabc);

    serde_json::json!({
        "connected": connected,
        "ssid": ssid,
        "is_uabc": is_uabc,
        "network_state": network_state.as_key(),
        "status_text": network_state.as_status_text()
    })
}

pub fn get_current_network_status() -> serde_json::Value {
    #[cfg(target_os = "android")]
    {
        let guard = match ANDROID_SSID.lock() {
            Ok(g) => g,
            Err(poisoned) => poisoned.into_inner(),
        };
        let ssid = guard.as_deref();
        return create_status_payload(ssid);
    }

    #[cfg(not(target_os = "android"))]
    {
        let guard = match LAST_STATE.lock() {
            Ok(g) => g,
            Err(poisoned) => poisoned.into_inner(),
        };
        let ssid = guard.as_ref().and_then(|state| state.ssid.as_deref());
        create_status_payload(ssid)
    }
}

#[cfg(any(target_os = "windows", target_os = "macos"))]
fn extract_ssid_from_line(line: &str) -> Option<String> {
    line.find(':')
        .map(|pos| line[pos + 1..].trim().to_string())
        .filter(|s| !s.is_empty())
}

#[cfg(target_os = "linux")]
fn parse_nmcli_wifi_line(line: &str) -> Option<(&str, String, &str)> {
    let first = line.find(':')?;
    let last = line.rfind(':')?;
    if first == last {
        return None;
    }

    let active = line[..first].trim();
    let ssid = line[first + 1..last]
        .replace(r#"\:"#, ":")
        .replace(r#"\\"#, r#"\"#)
        .trim()
        .to_string();
    let device = line[last + 1..].trim();

    Some((active, ssid, device))
}

#[cfg(target_os = "windows")]
fn parse_ssid_line(line: &str) -> Option<String> {
    let line_lower = line.to_lowercase();
    if (line_lower.contains("ssid") && !line_lower.contains("bssid"))
        || line_lower.contains("nombre de red")
        || line_lower.contains("network name")
    {
        extract_ssid_from_line(line)
            .filter(|s| !matches!(s.as_str(), "N/A" | "Ninguno" | "None"))
    } else {
        None
    }
}

#[cfg(not(target_os = "android"))]
fn get_wifi_ssid(interface_name: &str) -> Option<String> {
    let safe_name = match get_safe_interface_name(interface_name) {
        Some(name) => name,
        None => return Some("SSID no disponible".to_string()),
    };

    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = Command::new("iwgetid")
            .arg(&safe_name)
            .arg("--raw")
            .output()
        {
            if output.status.success() {
                let ssid = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !ssid.is_empty() {
                    return Some(ssid);
                }
            }
        }

        if let Ok(output) = Command::new("nmcli")
            .args(["-t", "-f", "active,ssid,device", "dev", "wifi"])
            .output()
        {
            if output.status.success() {
                for line in String::from_utf8_lossy(&output.stdout).lines() {
                    if let Some((active, ssid, device)) = parse_nmcli_wifi_line(line) {
                        if active == "yes" && device == safe_name && !ssid.is_empty() {
                            return Some(ssid);
                        }
                    }
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        match Command::new("netsh")
            .args(["wlan", "show", "interfaces"])
            .output()
        {
            Ok(output) => {
                if output.status.success() {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    let mut current_interface = false;

                    for line in stdout.lines() {
                        let line_lower = line.to_lowercase();
                        if line_lower.contains("nombre") || line_lower.contains("name") {
                            current_interface = line.contains(&safe_name as &str);
                            continue;
                        }
                        if current_interface {
                            if let Some(ssid) = parse_ssid_line(line) {
                                return Some(ssid);
                            }
                        }
                    }

                    for line in stdout.lines() {
                        if let Some(ssid) = parse_ssid_line(line) {
                            return Some(ssid);
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("[network-sync] Error netsh: {}", e);
            }
        }

        let escaped_name = safe_name.replace("'", "''");
        match Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                &format!(
                    "(Get-NetConnectionProfile | Where-Object {{ $_.InterfaceAlias -like '*{}*' }}).Name",
                    escaped_name
                ),
            ])
            .output()
        {
            Ok(output) => {
                if output.status.success() {
                    let ssid = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if !ssid.is_empty() {
                        return Some(ssid);
                    }
                }
            }
            Err(e) => {
                eprintln!("[network-sync] Error PowerShell: {}", e);
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        for airport_path in &[
            "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport",
            "/usr/sbin/airport",
        ] {
            if let Ok(output) = Command::new(airport_path).arg("-I").output() {
                if output.status.success() {
                    for line in String::from_utf8_lossy(&output.stdout).lines() {
                        if line.trim().starts_with("SSID:") {
                            if let Some(ssid) = extract_ssid_from_line(line) {
                                return Some(ssid);
                            }
                        }
                    }
                }
            }
        }

        let valid_interfaces: Vec<&str> = [safe_name.as_str(), "en0", "en1"]
            .iter()
            .filter(|iface| get_safe_interface_name(iface).is_some())
            .copied()
            .collect();

        for iface in valid_interfaces {
            if let Ok(output) = Command::new("networksetup")
                .args(["-getairportnetwork", iface])
                .output()
            {
                if output.status.success() {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    if let Some(ssid) = extract_ssid_from_line(&stdout) {
                        if !ssid.contains("You are not associated") && !ssid.contains("not associated") {
                            return Some(ssid);
                        }
                    }
                }
            }
        }

        if let Ok(output) = Command::new("system_profiler")
            .args(["SPAirPortDataType"])
            .output()
        {
            if output.status.success() {
                let mut in_current = false;
                for line in String::from_utf8_lossy(&output.stdout).lines() {
                    let trimmed = line.trim();
                    if trimmed.starts_with("Current Network Information:") {
                        in_current = true;
                    } else if in_current {
                        if trimmed.starts_with("Network Name:") || trimmed.starts_with("SSID:") {
                            if let Some(ssid) = extract_ssid_from_line(trimmed) {
                                return Some(ssid);
                            }
                        } else if trimmed.starts_with("---") {
                            in_current = false;
                        }
                    }
                }
            }
        }
    }

    Some("SSID no disponible".to_string())
}

#[inline]
#[cfg(not(target_os = "android"))]
fn is_wifi_interface(name: &str) -> bool {
    let name_lower = name.to_lowercase();

    #[cfg(target_os = "windows")]
    {
        name_lower.contains("wi-fi")
            || name_lower.contains("wlan")
            || name_lower.contains("wireless")
            || name_lower.contains("802.11")
    }

    #[cfg(target_os = "linux")]
    {
        name_lower.starts_with("wlan")
            || name_lower.starts_with("wlp")
            || name_lower.starts_with("wifi")
            || name_lower.contains("wireless")
    }

    #[cfg(target_os = "macos")]
    {
        matches!(name, "en0" | "en1")
            || name_lower.contains("wifi")
            || name_lower.contains("wireless")
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        name_lower.starts_with("wlan")
            || name_lower.starts_with("wlp")
            || name_lower.starts_with("wifi")
            || name_lower.starts_with("wi-fi")
            || name_lower.contains("wireless")
    }
}

fn emit_network_status(app: &tauri::AppHandle, ssid: Option<&str>) {
    let payload = create_status_payload(ssid);
    let _ = app.emit("network-status", payload);

    if check_is_uabc(ssid) {
        let _ = app.emit("uabc-detected", ());
    }
}

/// Fast-path: Android ya validó la conexión (hasInternet + hasValidated = true).
/// Si la red es UABC y hay internet según el sistema operativo, emitimos FineConnection
/// sin hacer ningún HTTP adicional. Si no cumple las condiciones, cae al check normal.
#[cfg(target_os = "android")]
fn emit_with_android_hint(app: &tauri::AppHandle, ssid: Option<&str>, os_validated_internet: bool) {
    let is_uabc = check_is_uabc(ssid);
    let connected = ssid.is_some();

    let network_state = if os_validated_internet && connected && is_uabc {
        // El SO ya confirmó internet + red UABC → directamente autenticado
        SyncNetworkState::FineConnection
    } else {
        // Verificación completa (HTTP check)
        resolve_sync_network_state(ssid, connected, is_uabc)
    };

    log_state_transition(network_state, ssid, connected, is_uabc);

    let payload = serde_json::json!({
        "connected": connected,
        "ssid": ssid,
        "is_uabc": is_uabc,
        "network_state": network_state.as_key(),
        "status_text": network_state.as_status_text()
    });

    let _ = app.emit("network-status", payload);
    if is_uabc {
        let _ = app.emit("uabc-detected", ());
    }
}

pub fn start_network_monitor(app: tauri::AppHandle) {
    MONITOR_ONCE.call_once(|| {
        #[cfg(target_os = "android")]
        tauri::async_runtime::spawn(android_monitor_loop(app));

        #[cfg(not(target_os = "android"))]
        thread::spawn(move || desktop_monitor_loop(app));
    });
}

// -------------------------------------------------------
// Android: monitor reactivo puro — cero polling
// -------------------------------------------------------

/// Intervalo del heartbeat de polling en Android.
/// El observer cubre cambios inmediatos; el polling garantiza consistencia
/// si se pierde algún evento del NetworkCallback.
const ANDROID_POLL_SECS: u64 = 12;

#[cfg(target_os = "android")]
async fn android_monitor_loop(app: tauri::AppHandle) {
    use tauri_plugin_wifi_interface::{WifiEventBusExt, WifiInterfaceExt};
    use tokio::sync::broadcast::error::RecvError;
    use tokio::time::{interval, Duration as TokioDuration};

    // Activar Android NetworkCallback (JNI blocking → spawn_blocking)
    {
        let wifi = app.wifi_interface().clone();
        match tauri::async_runtime::spawn_blocking(move || wifi.start_observing()).await {
            Ok(Ok(_)) => println!("[network-sync] Observer WiFi Android activado"),
            Ok(Err(e)) => eprintln!("[network-sync] Error activando observer: {e}"),
            Err(e) => eprintln!("[network-sync] Panic en start_observing: {e}"),
        }
    }

    // Estado inicial mientras llega el primer evento
    {
        let app_c = app.clone();
        tauri::async_runtime::spawn_blocking(move || emit_network_status(&app_c, None)).await.ok();
    }

    let mut rx = app.wifi_events();

    // Heartbeat de polling — fallback si el observer pierde algún evento
    let mut poll_ticker = interval(TokioDuration::from_secs(ANDROID_POLL_SECS));
    poll_ticker.tick().await; // consumir el tick inmediato inicial

    // Estado local para deduplicar — evita HTTP check en cambios de RSSI
    let mut last_ssid: Option<String> = None;
    let mut last_has_internet: Option<bool> = None;
    let mut last_has_validated: Option<bool> = None;

    loop {
        tokio::select! {
            // ── RAMA 1: evento push del observer ─────────────────────────
            recv_result = rx.recv() => {
                let event = match recv_result {
                    Ok(e) => e,
                    Err(RecvError::Lagged(n)) => {
                        eprintln!("[network-sync] WiFi bus lagged {n} eventos — re-emitiendo estado");
                        let ssid = last_ssid.clone();
                        let app_c = app.clone();
                        tauri::async_runtime::spawn_blocking(move || {
                            emit_network_status(&app_c, ssid.as_deref())
                        }).await.ok();
                        continue;
                    }
                    Err(RecvError::Closed) => {
                        eprintln!("[network-sync] WiFi event bus cerrado — solo queda polling");
                        // El observer falló; el heartbeat sigue corriendo
                        continue;
                    }
                };

                let (new_ssid, needs_eval) = match event.event.as_str() {
                    "available" => (last_ssid.clone(), true),
                    "lost" | "unavailable" => (None, true),
                    "capabilitiesChanged" => {
                        let ssid = event.ssid.clone();
                        let hi = event.has_internet;
                        let hv = event.has_validated;
                        // Ignorar si solo cambió RSSI/linkSpeed
                        let changed = ssid != last_ssid
                            || hi != last_has_internet
                            || hv != last_has_validated;
                        (ssid, changed)
                    }
                    _ => continue,
                };

                if !needs_eval {
                    continue;
                }

                last_ssid = new_ssid.clone();
                last_has_internet = event.has_internet;
                last_has_validated = event.has_validated;

                {
                    let mut guard = ANDROID_SSID.lock().unwrap_or_else(|p| p.into_inner());
                    *guard = new_ssid.as_deref().map(Box::from);
                }

                let ssid_owned = new_ssid.clone();
                let app_c = app.clone();
                let android_validated = event.has_validated.unwrap_or(false)
                    && event.has_internet.unwrap_or(false);

                tauri::async_runtime::spawn_blocking(move || {
                    emit_with_android_hint(&app_c, ssid_owned.as_deref(), android_validated);
                }).await.ok();
            }

            // ── RAMA 2: heartbeat de polling ──────────────────────────────
            _ = poll_ticker.tick() => {
                // Re-verificar el estado actual sin importar si llegó o no un evento.
                // Sirve como red de seguridad contra eventos perdidos o bugs del SO.
                let ssid = last_ssid.clone();
                let app_c = app.clone();
                tauri::async_runtime::spawn_blocking(move || {
                    emit_network_status(&app_c, ssid.as_deref());
                }).await.ok();
            }
        }
    }
}

// -------------------------------------------------------
// Desktop: monitor basado en netwatcher (sin cambios)
// -------------------------------------------------------

#[cfg(not(target_os = "android"))]
fn desktop_monitor_loop(app: tauri::AppHandle) {
    let is_first_update = Arc::new(Mutex::new(true));
    let is_first_clone = Arc::clone(&is_first_update);
    let app_clone = app.clone();

    match watch_interfaces(move |update: Update| {
        handle_network_update(update, &is_first_clone, &app_clone);
    }) {
        Ok(_handle) => {
            loop {
                thread::park();
            }
        }
        Err(err) => {
            eprintln!("[network-sync] Error al iniciar el monitor de red: {err}");
            let _ = app.emit("network-status", serde_json::json!({
                "connected": false,
                "ssid": null,
                "is_uabc": false,
                "error": format!("No se pudo iniciar el monitor de red: {}", err)
            }));

            loop {
                thread::sleep(Duration::from_secs(30));

                let is_first_retry = Arc::new(Mutex::new(true));
                let is_first_retry_clone = Arc::clone(&is_first_retry);
                let app_retry = app.clone();

                match watch_interfaces(move |update: Update| {
                    handle_network_update(update, &is_first_retry_clone, &app_retry);
                }) {
                    Ok(_new_handle) => {
                        eprintln!("[network-sync] Monitor de red reiniciado exitosamente");
                        loop {
                            thread::park();
                        }
                    }
                    Err(retry_err) => {
                        eprintln!("[network-sync] Reintento fallido: {retry_err}");
                    }
                }
            }
        }
    }
}

#[cfg(not(target_os = "android"))]
fn handle_network_update(
    update: Update,
    is_first_update: &Arc<Mutex<bool>>,
    app: &tauri::AppHandle,
) {
    let current_state = WifiState::from_interfaces(&update.interfaces);

    let is_first = match is_first_update.lock() {
        Ok(mut guard) => std::mem::replace(&mut *guard, false),
        Err(poisoned) => {
            eprintln!("[network-sync] Lock envenenado en is_first_update, recuperando");
            std::mem::replace(&mut *poisoned.into_inner(), false)
        }
    };

    if is_first {
        emit_network_status(app, current_state.as_ref().and_then(|s| s.ssid.as_deref()));
        match LAST_STATE.lock() {
            Ok(mut guard) => *guard = current_state,
            Err(poisoned) => *poisoned.into_inner() = current_state,
        }
        return;
    }

    let mut state_guard = match LAST_STATE.lock() {
        Ok(guard) => guard,
        Err(poisoned) => {
            eprintln!("[network-sync] Lock envenenado en LAST_STATE, recuperando");
            poisoned.into_inner()
        }
    };
    let previous_state = state_guard.clone();

    match (&previous_state, &current_state) {
        (Some(prev), Some(curr)) if prev.ssid != curr.ssid || prev.ipv4 != curr.ipv4 => {
            let mut updated_state = curr.clone();
            if updated_state.ssid.is_none() {
                thread::sleep(Duration::from_millis(SSID_RETRY_DELAY_MS));
                updated_state.ssid = get_wifi_ssid(&curr.interface).map(|s| s.into_boxed_str());
            }
            if prev.ssid != updated_state.ssid {
                emit_network_status(app, updated_state.ssid.as_deref());
            }
            *state_guard = Some(updated_state);
        }
        (None, Some(curr)) => {
            if curr.ssid.is_some() {
                emit_network_status(app, curr.ssid.as_deref());
            }
            *state_guard = current_state;
        }
        (Some(_), None) => {
            emit_network_status(app, None);
            *state_guard = None;
        }
        _ => {}
    }
}
