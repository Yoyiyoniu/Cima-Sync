use lazy_static::lazy_static;
use netwatcher::{watch_interfaces, Interface, Update};
use std::collections::HashMap;
use std::process::Command;
use std::sync::{Arc, Mutex, Once};
use std::thread;
use std::time::Duration;
use tauri::Emitter;

static MONITOR_ONCE: Once = Once::new();

lazy_static! {
    static ref LAST_STATE: Arc<Mutex<Option<WifiState>>> = Arc::new(Mutex::new(None));
}

const SSID_RETRY_DELAY_MS: u64 = 500;

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
        .unwrap()
        .as_ref()
        .and_then(|state| state.ssid.clone());
    create_status_payload(ssid)
}

fn get_wifi_ssid(interface_name: &str) -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = Command::new("iwgetid")
            .arg(interface_name)
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
                let stdout = String::from_utf8_lossy(&output.stdout);
                for line in stdout.lines() {
                    let parts: Vec<&str> = line.split(':').collect();
                    if parts.len() >= 3 && parts[0] == "yes" && parts[2] == interface_name {
                        let ssid = parts[1].trim().to_string();
                        if !ssid.is_empty() {
                            return Some(ssid);
                        }
                    }
                }
            }
        }

        Some("SSID no disponible".to_string())
    }

    #[cfg(not(target_os = "linux"))]
    {
        eprintln!("[network-sync] get_wifi_ssid no está implementado para este sistema operativo; usando fallback genérico");
        Some("SSID no disponible".to_string())
    }
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

    let _handle = match watch_interfaces(move |update: Update| {
        handle_network_update(update, &is_first_update, &app);
    }) {
        Ok(handle) => handle,
        Err(err) => {
            eprintln!("[network-sync] Error al iniciar el monitor: {err}");
            return;
        }
    };

    loop {
        thread::park();
    }
}

fn emit_network_status(app: &tauri::AppHandle, ssid: Option<String>) {
    let is_uabc = check_is_uabc(&ssid);
    let payload = create_status_payload(ssid);

    if let Err(e) = app.emit("network-status", payload) {
        eprintln!(
            "[network-sync] Error emitiendo evento network-status: {}",
            e
        );
    }

    if is_uabc {
        if let Err(e) = app.emit("uabc-detected", ()) {
            eprintln!("[network-sync] Error emitiendo evento uabc-detected: {}", e);
        }
    }
}

fn handle_network_update(
    update: Update,
    is_first_update: &Arc<Mutex<bool>>,
    app: &tauri::AppHandle,
) {
    let current_state = WifiState::from_interfaces(&update.interfaces);

    let is_first = {
        let mut guard = is_first_update.lock().unwrap();
        std::mem::replace(&mut *guard, false)
    };

    if is_first {
        let ssid = current_state.as_ref().and_then(|s| s.ssid.clone());
        if let Some(ref ssid_str) = ssid {
            println!("[network-sync] WiFi actual: '{}'", ssid_str);
        }
        emit_network_status(app, ssid);
        *LAST_STATE.lock().unwrap() = current_state;
        return;
    }

    let mut state_guard = LAST_STATE.lock().unwrap();
    let previous_state = state_guard.clone();

    match (&previous_state, &current_state) {
        (Some(prev), Some(curr)) => {
            if prev.ssid != curr.ssid || prev.ipv4 != curr.ipv4 {
                let mut updated_state = curr.clone();

                if updated_state.ssid.is_none() {
                    thread::sleep(Duration::from_millis(SSID_RETRY_DELAY_MS));
                    updated_state.ssid = get_wifi_ssid(&curr.interface);
                }

                if prev.ssid != updated_state.ssid {
                    let prev_ssid = prev.ssid.as_deref().unwrap_or("desconocida");
                    let curr_ssid = updated_state.ssid.as_deref().unwrap_or("desconocida");
                    println!(
                        "[network-sync] Cambio de red WiFi: '{}' -> '{}'",
                        prev_ssid, curr_ssid
                    );
                    emit_network_status(app, updated_state.ssid.clone());
                }

                *state_guard = Some(updated_state);
            }
        }
        (None, Some(curr)) => {
            if let Some(ref ssid) = curr.ssid {
                println!("[network-sync] WiFi conectado: '{}'", ssid);
                emit_network_status(app, Some(ssid.clone()));
            }
            *state_guard = current_state;
        }
        (Some(prev), None) => {
            if let Some(ref ssid) = prev.ssid {
                println!("[network-sync] WiFi desconectado: '{}'", ssid);
            }
            emit_network_status(app, None);
            *state_guard = None;
        }
        (None, None) => {}
    }
}
