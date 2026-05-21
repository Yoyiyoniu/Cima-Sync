use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

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

pub trait WifiInterfaceExt<R: Runtime> {
    fn wifi_interface(&self) -> &WifiInterface<R>;
}

impl<R: Runtime, T: Manager<R>> crate::WifiInterfaceExt<R> for T {
    fn wifi_interface(&self) -> &WifiInterface<R> {
        self.state::<WifiInterface<R>>().inner()
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("wifi-interface")
        .invoke_handler(tauri::generate_handler![
            commands::bind_to_wifi,
            commands::unbind_network,
            commands::get_wifi_status,
        ])
        .setup(|app, api| {
            #[cfg(mobile)]
            let wifi_interface = mobile::init(app, api)?;
            #[cfg(desktop)]
            let wifi_interface = desktop::init(app, api)?;
            app.manage(wifi_interface);
            Ok(())
        })
        .build()
}
