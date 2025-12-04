use netwatcher::{watch_interfaces, Interface, Update};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, Once};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use std::process::Command;
use tauri::Emitter;

static MONITOR_ONCE: Once = Once::new();

// NETWORK SYNC CONFIGURATION
const SSID_RETRY_DELAY_MS: u64 = 500;
const THREAD_KEEP_ALIVE_TIMEOUT_SECS: u64 = 3600;

#[derive(Clone, Debug, PartialEq, Eq)]
struct WifiState {
    interface: String,
    ssid: Option<String>,
    ipv4: Option<String>,
}

impl WifiState {
    fn from_interfaces(interfaces: &HashMap<u32, Interface>) -> Option<Self> {

        for interface in interfaces.values() {
            if interface.ips.is_empty() || !is_wifi_interface(&interface.name) {
                continue;
            }

            // Filtrar IPs IPv4 válidas (excluyendo IPv6 link-local y APIPA)
            let ipv4 = interface
                .ips
                .iter()
                .find(|ip| {
                    let ip_str = ip.ip.to_string();
                    !ip_str.starts_with("fe80:") && !ip_str.starts_with("169.254.")
                })
                .map(|ip| ip.ip.to_string());

            if ipv4.is_some() {
                return Some(WifiState {
                    interface: interface.name.clone(),
                    ssid: get_wifi_ssid(&interface.name),
                    ipv4,
                });
            }
        }
        None
        
    }
}

/// Obtiene el SSID de una interfaz WiFi usando comandos del sistema
/// En Linux intenta primero con iwgetid, luego con nmcli como fallback
fn get_wifi_ssid(interface_name: &str) -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        Command::new("iwgetid")
            .arg("-r")
            .arg(interface_name)
            .output()
            .ok()
            .filter(|o| o.status.success())
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .or_else(|| {
                // Fallback: usar nmcli si iwgetid no está disponible
                Command::new("nmcli")
                    .args(&["-t", "-f", "active,ssid", "dev", "wifi"])
                    .output()
                    .ok()
                    .filter(|o| o.status.success())
                    .and_then(|o| String::from_utf8(o.stdout).ok())
                    .and_then(|output| {
                        output
                            .lines()
                            .find(|l| l.starts_with("yes:"))
                            .and_then(|l| l.split(':').nth(1))
                            .map(|s| s.trim().to_string())
                            .filter(|s| !s.is_empty())
                    })
            })
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("netsh")
            .args(&["wlan", "show", "interfaces"])
            .output()
            .ok()
            .filter(|o| o.status.success())
            .and_then(|o| String::from_utf8_lossy(&o.stdout).lines().find_map(|line| {
                if line.trim().starts_with("SSID") {
                    line.split(':').nth(1)
                        .map(|s| s.trim().to_string())
                        .filter(|s| !s.is_empty() && s != "N/A")
                } else {
                    None
                }
            }))
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport")
            .arg("-I")
            .output()
            .ok()
            .filter(|o| o.status.success())
            .and_then(|o| String::from_utf8_lossy(&o.stdout).lines().find_map(|line| {
                if line.trim().starts_with("SSID:") {
                    line.split(':').nth(1)
                        .map(|s| s.trim().to_string())
                        .filter(|s| !s.is_empty())
                } else {
                    None
                }
            }))
    }

    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        None
    }
}

/// Detecta si una interfaz es WiFi
#[inline]
fn is_wifi_interface(name: &str) -> bool {
    let name_lower = name.to_lowercase();
    let name_bytes = name_lower.as_bytes();
    let name_len = name_bytes.len();

    #[cfg(target_os = "windows")]
    {
        name_lower.contains("wi-fi")
            || name_lower.contains("wlan")
            || name_lower.contains("wireless")
            || name_lower.contains("802.11")
    }

    #[cfg(target_os = "linux")]
    {
        (name_len >= 4 && name_bytes.starts_with(b"wlan"))
            || (name_len >= 3 && name_bytes.starts_with(b"wlp"))
            || (name_len >= 4 && name_bytes.starts_with(b"wifi"))
            || name_lower.contains("wireless")
    }

    #[cfg(target_os = "macos")]
    {
        (name_len >= 2 && name_bytes.starts_with(b"en")
            && name_len == 3 && (name_bytes[2] == b'0' || name_bytes[2] == b'1'))
            || name_lower.contains("wifi")
            || name_lower.contains("wireless")
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        (name_len >= 4 && name_bytes.starts_with(b"wlan"))
            || (name_len >= 3 && name_bytes.starts_with(b"wlp"))
            || (name_len >= 4 && name_bytes.starts_with(b"wifi"))
            || name_lower.starts_with("wi-fi")
            || name_lower.contains("wireless")
    }
}

/// Inicia el monitor de red
pub fn start_network_monitor(app: tauri::AppHandle) {
    MONITOR_ONCE.call_once(|| {
        thread::spawn(move || monitor_loop(app));
    });
}

fn monitor_loop(app: tauri::AppHandle) {
    let last_state = Arc::new(Mutex::new(Option::<WifiState>::None));
    let is_first_update = Arc::new(Mutex::new(true));

    let last_state_clone = Arc::clone(&last_state);
    let is_first_update_clone = Arc::clone(&is_first_update);

    let _handle = match watch_interfaces(move |update: Update| {
        handle_network_update(update, &last_state_clone, &is_first_update_clone, &app);
    }) {
        Ok(handle) => handle,
        Err(err) => {
            eprintln!("[network-sync] Error al iniciar el monitor: {err}");
            return;
        }
    };

    // Usar un channel que nunca recibe nada para mantener el thread vivo
    // El handle del monitor debe permanecer en scope para que funcione
    let (_sender, receiver) = mpsc::channel::<()>();
    loop {
        if receiver.recv_timeout(Duration::from_secs(THREAD_KEEP_ALIVE_TIMEOUT_SECS)).is_ok() {
            break;
        }
    }
}

fn emit_network_status(app: &tauri::AppHandle, ssid: Option<String>) {
    let is_uabc = ssid.as_ref().map(|s| s.contains("UABC")).unwrap_or(false);
    let connected = ssid.is_some();
    
    let payload = serde_json::json!({
        "connected": connected,
        "ssid": ssid,
        "is_uabc": is_uabc
    });

    if let Err(e) = app.emit("network-status", payload) {
        eprintln!("Error emitting network-status event: {}", e);
    }

    if is_uabc {
         if let Err(e) = app.emit("uabc-detected", ()) {
             eprintln!("Error emitting uabc-detected event: {}", e);
         }
    }
}

fn handle_network_update(
    update: Update,
    last_state: &Arc<Mutex<Option<WifiState>>>,
    is_first_update: &Arc<Mutex<bool>>,
    app: &tauri::AppHandle,
) {
    let current_state = WifiState::from_interfaces(&update.interfaces);

    let is_first = {
        let mut guard = is_first_update.lock().unwrap();
        if *guard {
            *guard = false;
            true
        } else {
            false
        }
    };

    if is_first {
        if let Some(state) = &current_state {
            if let Some(ssid) = &state.ssid {
                println!("[network-sync] WiFi actual: '{}'", ssid);
                emit_network_status(app, Some(ssid.clone()));
            } else {
                println!("[network-sync] WiFi actual: conectado (SSID no disponible)");
                emit_network_status(app, None);
            }
        } else {
             emit_network_status(app, None);
        }
        *last_state.lock().unwrap() = current_state;
        return;
    }

    let mut state_guard = last_state.lock().unwrap();
    let previous_state = state_guard.clone();

    if let (Some(prev), Some(curr)) = (&previous_state, &current_state) {
        let ssid_changed = prev.ssid != curr.ssid;
        let ip_changed = prev.ipv4 != curr.ipv4;

        if ssid_changed || ip_changed {
            let prev_ssid = prev.ssid.as_deref().unwrap_or("desconocida");
            
            // Si el SSID no está disponible inmediatamente después del cambio,
            // esperar un poco para que el sistema lo actualice y reintentar
            let mut updated_state = curr.clone();
            if updated_state.ssid.is_none() {
                thread::sleep(Duration::from_millis(SSID_RETRY_DELAY_MS));
                updated_state.ssid = get_wifi_ssid(&curr.interface);
            }
            
            let curr_ssid = updated_state.ssid.as_deref().unwrap_or("desconocida");

            if prev_ssid != curr_ssid {
                println!("[network-sync] Cambio de red WiFi: '{}' -> '{}'", prev_ssid, curr_ssid);
                emit_network_status(app, updated_state.ssid.clone());
            } else if ip_changed {
                println!("[network-sync] Cambio de red WiFi: '{}' (reconexión)", curr_ssid);
            }
            
            // Actualizar con el SSID obtenido para evitar detectar el cambio dos veces
            *state_guard = Some(updated_state);
            return;
        }
    } else if previous_state.is_none() && current_state.is_some() {
        if let Some(ssid) = &current_state.as_ref().unwrap().ssid {
            println!("[network-sync] WiFi conectado: '{}'", ssid);
            emit_network_status(app, Some(ssid.clone()));
        }
    } else if previous_state.is_some() && current_state.is_none() {
        if let Some(ssid) = &previous_state.as_ref().unwrap().ssid {
            println!("[network-sync] WiFi desconectado: '{}'", ssid);
        }
        emit_network_status(app, None);
    }

    *state_guard = current_state;
}
