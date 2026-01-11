use lazy_static::lazy_static;
use netwatcher::{watch_interfaces, Interface, Update};
use regex::Regex;
use std::collections::HashMap;
use std::process::Command;
use std::sync::{Arc, Mutex, Once};
use std::thread;
use std::time::Duration;
use tauri::Emitter;

static MONITOR_ONCE: Once = Once::new();

lazy_static! {
    static ref LAST_STATE: Arc<Mutex<Option<WifiState>>> = Arc::new(Mutex::new(None));
    static ref INTERFACE_NAME_REGEX: Regex = Regex::new(r"^[a-zA-Z0-9_\-\.]+$")
        .expect("Regex de interfaz inválido");
}

const SSID_RETRY_DELAY_MS: u64 = 500;
const MAX_INTERFACE_NAME_LENGTH: usize = 64;

#[derive(Debug)]
enum InterfaceValidation {
    Valid(String),
    Invalid(String),
}

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
    interface: String,
    ssid: Option<String>,
    ipv4: Option<String>,
}

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
                    interface: iface.name.clone(),
                    ssid: get_wifi_ssid(&iface.name),
                    ipv4: Some(ipv4),
                })
            })
    }
}

#[inline]
fn check_is_uabc(ssid: &Option<String>) -> bool {
    ssid.as_ref().map(|s| s.contains("UABC")).unwrap_or(false)
}

fn create_status_payload(ssid: Option<String>) -> serde_json::Value {
    let is_uabc = check_is_uabc(&ssid);
    let connected = ssid.is_some();

    serde_json::json!({
        "connected": connected,
        "ssid": ssid,
        "is_uabc": is_uabc
    })
}

pub fn get_current_network_status() -> serde_json::Value {
    let ssid = LAST_STATE
        .lock()
        .ok()
        .and_then(|guard| guard.as_ref().and_then(|state| state.ssid.clone()));
    create_status_payload(ssid)
}

fn extract_ssid_from_line(line: &str) -> Option<String> {
    line.find(':')
        .map(|pos| line[pos + 1..].trim().to_string())
        .filter(|s| !s.is_empty())
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
                    let parts: Vec<&str> = line.split(':').collect();
                    if parts.len() >= 3 && parts[0] == "yes" && parts[2] == safe_name {
                        if let Some(ssid) = extract_ssid_from_line(parts[1]) {
                            return Some(ssid);
                        }
                    }
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = Command::new("netsh")
            .args(["wlan", "show", "interfaces"])
            .output()
        {
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

        let escaped_name = safe_name.replace("'", "''");
        if let Ok(output) = Command::new("powershell")
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
            if output.status.success() {
                if let Some(ssid) = extract_ssid_from_line(&String::from_utf8_lossy(&output.stdout)) {
                    return Some(ssid);
                }
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

    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        eprintln!("[network-sync] get_wifi_ssid no implementado para este SO");
    }

    Some("SSID no disponible".to_string())
}

#[inline]
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

pub fn start_network_monitor(app: tauri::AppHandle) {
    MONITOR_ONCE.call_once(|| {
        thread::spawn(move || monitor_loop(app));
    });
}

fn monitor_loop(app: tauri::AppHandle) {
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

fn emit_network_status(app: &tauri::AppHandle, ssid: Option<String>) {
    let payload = create_status_payload(ssid.clone());
    let _ = app.emit("network-status", payload);

    if check_is_uabc(&ssid) {
        let _ = app.emit("uabc-detected", ());
    }
}

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
        emit_network_status(app, current_state.as_ref().and_then(|s| s.ssid.clone()));
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
                updated_state.ssid = get_wifi_ssid(&curr.interface);
            }
            if prev.ssid != updated_state.ssid {
                emit_network_status(app, updated_state.ssid.clone());
            }
            *state_guard = Some(updated_state);
        }
        (None, Some(curr)) => {
            if curr.ssid.is_some() {
                emit_network_status(app, curr.ssid.clone());
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
