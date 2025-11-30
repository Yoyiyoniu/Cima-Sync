#[cfg(target_os = "linux")]
mod linux {
    use dbus::blocking::stdintf::org_freedesktop_dbus::PropertiesPropertiesChanged;
    use dbus::blocking::Connection;
    use dbus::message::SignalArgs;
    use networkmanager::devices::{Any, Device, Wireless};
    use networkmanager::{Error as NmError, NetworkManager};
    use std::sync::mpsc;
    use std::sync::Once;
    use std::thread;
    use std::time::{Duration, Instant};

    const DBUS_POLL_TIMEOUT: Duration = Duration::from_secs(30);
    const MIN_REFRESH_INTERVAL: Duration = Duration::from_millis(750);
    static MONITOR_ONCE: Once = Once::new();

    pub(super) fn start() {
        MONITOR_ONCE.call_once(|| {
            thread::spawn(monitor_loop);
        });
    }

    #[derive(Debug)]
    enum ObserverEvent {
        Refresh { origin: String },
    }

    fn monitor_loop() {
        let connection = match Connection::new_system() {
            Ok(conn) => conn,
            Err(err) => {
                eprintln!(
                    "[network-sync] No se pudo abrir la conexión D-Bus del sistema: {err}"
                );
                return;
            }
        };

        let nm = NetworkManager::new(&connection);
        println!("[network-sync] Escuchando cambios de red WiFi vía D-Bus...");

        let (event_tx, event_rx) = mpsc::channel::<ObserverEvent>();

        if let Err(err) = register_property_listeners(&connection, event_tx.clone()) {
            eprintln!("[network-sync] No se pudieron registrar los observadores: {err}");
            return;
        }

        let _ = event_tx.send(ObserverEvent::Refresh {
            origin: "Inicio de observador".into(),
        });

        let mut last_state: Option<WiFiState> = None;
        let mut last_refresh = Instant::now() - MIN_REFRESH_INTERVAL;

        loop {
            match connection.process(DBUS_POLL_TIMEOUT) {
                Ok(_) => {}
                Err(err) => {
                    eprintln!("[network-sync] Error procesando señales D-Bus: {err}");
                    thread::sleep(Duration::from_secs(1));
                    continue;
                }
            }

            while let Ok(event) = event_rx.try_recv() {
                handle_event(event, &nm, &mut last_state, &mut last_refresh);
            }
        }
    }

    fn register_property_listeners(
        connection: &Connection,
        event_tx: mpsc::Sender<ObserverEvent>,
    ) -> Result<(), dbus::Error> {
        connection.set_signal_match_mode(true);

        add_properties_match(
            connection,
            "/org/freedesktop/NetworkManager/Devices",
            true,
            "Dispositivo",
            event_tx.clone(),
        )?;

        add_properties_match(
            connection,
            "/org/freedesktop/NetworkManager",
            false,
            "Gestor",
            event_tx,
        )?;

        Ok(())
    }

    fn add_properties_match(
        connection: &Connection,
        path: &'static str,
        is_namespace: bool,
        label: &'static str,
        event_tx: mpsc::Sender<ObserverEvent>,
    ) -> Result<(), dbus::Error> {
        let mut rule = PropertiesPropertiesChanged::match_rule(None, None);
        if is_namespace {
            rule = rule.with_namespaced_path(path);
        } else {
            rule = rule.with_path(path);
        }
        let rule = rule.static_clone();

        connection.add_match(rule, move |signal: PropertiesPropertiesChanged, _, msg| {
            if should_emit_refresh(&signal) {
                let path_str = msg
                    .path()
                    .map(|p| p.to_string())
                    .unwrap_or_else(|| path.to_string());
                let reason = format!(
                    "{}: {} (interfaz {})",
                    label, path_str, signal.interface_name
                );
                let _ = event_tx.send(ObserverEvent::Refresh { origin: reason });
            }
            true
        })?;

        Ok(())
    }

    fn handle_event(
        event: ObserverEvent,
        nm: &NetworkManager,
        last_state: &mut Option<WiFiState>,
        last_refresh: &mut Instant,
    ) {
        match event {
            ObserverEvent::Refresh { origin } => {
                if last_refresh.elapsed() < MIN_REFRESH_INTERVAL {
                    return;
                }
                println!("[network-sync] Evento D-Bus: {}", origin);
                refresh_wifi_state(nm, last_state);
                *last_refresh = Instant::now();
            }
        }
    }

    fn should_emit_refresh(signal: &PropertiesPropertiesChanged) -> bool {
        match signal.interface_name.as_str() {
            "org.freedesktop.NetworkManager.Device.Wireless" => {
                changed_any(signal, &["ActiveAccessPoint"])
            }
            "org.freedesktop.NetworkManager.AccessPoint" => {
                changed_any(signal, &["Ssid"])
            }
            _ => false,
        }
    }

    fn changed_any(signal: &PropertiesPropertiesChanged, keys: &[&str]) -> bool {
        keys.iter().any(|key| {
            signal.changed_properties.contains_key(*key)
                || signal.invalidated_properties.iter().any(|prop| prop == key)
        })
    }

    fn refresh_wifi_state(nm: &NetworkManager, last_state: &mut Option<WiFiState>) {
        match current_wifi_state(nm) {
            Ok(current) => {
                log_current_state(&current);
                if current != *last_state {
                    log_state_change(last_state, &current);
                    *last_state = current.clone();
                }
            }
            Err(err) => {
                eprintln!("[network-sync] Error consultando NetworkManager: {err}");
            }
        }
    }

    fn current_wifi_state(nm: &NetworkManager) -> Result<Option<WiFiState>, NmError> {
        for device in nm.get_devices()? {
            if let Device::WiFi(wifi_device) = device {
                let interface = wifi_device.interface()?;

                match wifi_device.active_access_point() {
                    Ok(access_point) => {
                        let state = WiFiState {
                            interface,
                            ssid: access_point.ssid()?,
                            bssid: access_point.hw_address()?,
                            strength: access_point.strength()?,
                        };

                        return Ok(Some(state));
                    }
                    Err(err) if is_missing_active_ap(&err) => continue,
                    Err(err) => return Err(err),
                }
            }
        }

        Ok(None)
    }

    fn log_state_change(previous: &Option<WiFiState>, current: &Option<WiFiState>) {
        match (previous, current) {
            (None, Some(curr)) => log_connected(curr),
            (Some(prev), Some(curr)) => {
                println!(
                    "[network-sync] Cambio de red WiFi '{}' -> '{}'",
                    prev.ssid, curr.ssid
                );
                log_connected(curr);
            }
            (Some(prev), None) => {
                println!(
                    "[network-sync] WiFi desconectada (última red '{}', interfaz {})",
                    prev.ssid, prev.interface
                );
            }
            (None, None) => {}
        }
    }

    fn log_connected(state: &WiFiState) {
        println!(
            "[network-sync] Conectado a '{}' (iface {}, BSSID {}, intensidad {}%)",
            state.ssid, state.interface, state.bssid, state.strength
        );
    }

    fn log_current_state(state: &Option<WiFiState>) {
        match state {
            Some(current) => println!(
                "[network-sync] WiFi actual: '{}' (iface {}, BSSID {}, intensidad {}%)",
                current.ssid, current.interface, current.bssid, current.strength
            ),
            None => println!("[network-sync] Sin conexión WiFi activa"),
        }
    }

    fn is_missing_active_ap(err: &NmError) -> bool {
        match err {
            NmError::DBus(dbus_err) => dbus_err
                .name()
                .map(|name| {
                    name == "org.freedesktop.DBus.Error.UnknownObject"
                        || name == "org.freedesktop.DBus.Error.InvalidArgs"
                })
                .unwrap_or(false),
            _ => false,
        }
    }

    #[derive(Clone, Debug)]
    struct WiFiState {
        interface: String,
        ssid: String,
        bssid: String,
        strength: u8,
    }

    impl PartialEq for WiFiState {
        fn eq(&self, other: &Self) -> bool {
            self.interface == other.interface
                && self.ssid == other.ssid
                && self.bssid == other.bssid
        }
    }

    impl Eq for WiFiState {}
}

#[cfg(target_os = "windows")]
mod windows {
    // TODO: Implement network monitor for Windows
}

#[cfg(target_os = "macos")]
mod macos {
    // TODO: Implement network monitor for macOS
}


#[cfg(target_os = "linux")]
pub fn start_network_monitor() {
    linux::start();
}

#[cfg(not(target_os = "linux"))]
pub fn start_network_monitor() {
    eprintln!("[network-sync] No se implementó el monitor de red para este sistema operativo");
}

