use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_android_services);

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<AndroidServices<R>> {
    #[cfg(target_os = "android")]
    let handle =
        api.register_android_plugin("me.rodrigoleon.androidservices", "AndroidServicesPlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_android_services)?;
    Ok(AndroidServices(handle))
}

pub struct AndroidServices<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> AndroidServices<R> {
    pub fn start_service(&self) -> crate::Result<ServiceStartResult> {
        self.0.run_mobile_plugin("startService", ()).map_err(Into::into)
    }

    pub fn stop_service(&self) -> crate::Result<ServiceStopResult> {
        self.0.run_mobile_plugin("stopService", ()).map_err(Into::into)
    }

    pub fn is_running(&self) -> crate::Result<ServiceStatus> {
        self.0.run_mobile_plugin("isRunning", ()).map_err(Into::into)
    }

    pub fn execute_task(&self, payload: ExecuteTaskRequest) -> crate::Result<TaskQueueResult> {
        self.0.run_mobile_plugin("executeTask", payload).map_err(Into::into)
    }

    pub fn request_notifications_permission(&self) -> crate::Result<NotificationsPermissionResult> {
        self.0.run_mobile_plugin("requestNotificationsPermission", ()).map_err(Into::into)
    }
}
