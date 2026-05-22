use std::sync::Arc;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};
use tokio::sync::broadcast;

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::WifiInterface;
#[cfg(mobile)]
use mobile::WifiInterface;

// -------------------------------------------------------
// Bus de eventos WiFi — broadcast sin polling
// Los sub-procesos Rust suscriben un Receiver y esperan
// con .recv().await; cero timers, cero polling.
// -------------------------------------------------------

pub struct WifiEventBus(Arc<broadcast::Sender<WifiEvent>>);

impl WifiEventBus {
    /// Devuelve un Receiver listo para consumir con `.recv().await`.
    pub fn subscribe(&self) -> broadcast::Receiver<WifiEvent> {
        self.0.subscribe()
    }
}

pub trait WifiInterfaceExt<R: Runtime> {
    fn wifi_interface(&self) -> &WifiInterface<R>;
}

pub trait WifiEventBusExt<R: Runtime> {
    /// Suscríbete al stream de eventos WiFi desde cualquier tarea Rust.
    fn wifi_events(&self) -> broadcast::Receiver<WifiEvent>;
}

impl<R: Runtime, T: Manager<R>> WifiInterfaceExt<R> for T {
    fn wifi_interface(&self) -> &WifiInterface<R> {
        self.state::<WifiInterface<R>>().inner()
    }
}

impl<R: Runtime, T: Manager<R>> WifiEventBusExt<R> for T {
    fn wifi_events(&self) -> broadcast::Receiver<WifiEvent> {
        self.state::<WifiEventBus>().inner().subscribe()
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("wifi-interface")
        .invoke_handler(tauri::generate_handler![
            commands::bind_to_wifi,
            commands::unbind_network,
            commands::get_wifi_status,
            commands::start_observing,
            commands::stop_observing,
        ])
        .setup(|app, api| {
            #[cfg(mobile)]
            let wifi_interface = mobile::init(app, api)?;
            #[cfg(desktop)]
            let wifi_interface = desktop::init(app, api)?;

            // Canal broadcast: capacidad 64 eventos en vuelo.
            // Si un receptor es lento y se queda atrás recibirá
            // RecvError::Lagged pero nunca bloqueará a los demás.
            let (tx, _) = broadcast::channel::<WifiEvent>(64);
            let bus = WifiEventBus(Arc::new(tx));

            // Tarea de streaming: bloquea un hilo del pool de blocking
            // esperando cada evento de Android; cuando llega lo publica
            // en el bus sin ningún timer entre iteraciones.
            #[cfg(mobile)]
            {
                let wifi = wifi_interface.clone();
                let sender = bus.0.clone();

                tauri::async_runtime::spawn(async move {
                    loop {
                        let wifi_inner = wifi.clone();

                        // spawn_blocking porque next_wifi_event() hace JNI
                        // y bloquea el hilo hasta que Android resuelve el invoke.
                        let result = tauri::async_runtime::spawn_blocking(move || {
                            wifi_inner.next_wifi_event()
                        })
                        .await;

                        match result {
                            Ok(Ok(event)) => {
                                // Ignoramos si no hay suscriptores activos
                                let _ = sender.send(event);
                            }
                            // Android llamó invoke.reject("stopped") → salimos
                            Ok(Err(_)) => break,
                            // El hilo de blocking panicked
                            Err(_) => break,
                        }
                    }
                });
            }

            app.manage(bus);
            app.manage(wifi_interface);
            Ok(())
        })
        .build()
}
