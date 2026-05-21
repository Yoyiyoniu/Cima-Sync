use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<AndroidServices<R>> {
    Ok(AndroidServices(app.clone()))
}

pub struct AndroidServices<R: Runtime>(AppHandle<R>);

impl<R: Runtime> AndroidServices<R> {
    pub fn start_service(&self) -> crate::Result<ServiceStartResult> {
        Err(crate::Error::NotSupported)
    }

    pub fn stop_service(&self) -> crate::Result<ServiceStopResult> {
        Err(crate::Error::NotSupported)
    }

    pub fn is_running(&self) -> crate::Result<ServiceStatus> {
        Err(crate::Error::NotSupported)
    }

    pub fn execute_task(&self, _payload: ExecuteTaskRequest) -> crate::Result<TaskQueueResult> {
        Err(crate::Error::NotSupported)
    }
}
