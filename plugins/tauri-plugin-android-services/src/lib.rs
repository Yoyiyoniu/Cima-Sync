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
use desktop::AndroidServices;
#[cfg(mobile)]
use mobile::AndroidServices;

pub trait AndroidServicesExt<R: Runtime> {
    fn android_services(&self) -> &AndroidServices<R>;
}

impl<R: Runtime, T: Manager<R>> crate::AndroidServicesExt<R> for T {
    fn android_services(&self) -> &AndroidServices<R> {
        self.state::<AndroidServices<R>>().inner()
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("android-services")
        .invoke_handler(tauri::generate_handler![
            commands::start_service,
            commands::stop_service,
            commands::is_running,
            commands::execute_task,
            commands::request_notifications_permission,
        ])
        .setup(|app, api| {
            #[cfg(mobile)]
            let android_services = mobile::init(app, api)?;
            #[cfg(desktop)]
            let android_services = desktop::init(app, api)?;
            app.manage(android_services);
            Ok(())
        })
        .build()
}
