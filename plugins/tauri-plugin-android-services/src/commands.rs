use tauri::{command, AppHandle, Runtime};

use crate::models::*;
use crate::Result;
use crate::AndroidServicesExt;

#[command]
pub(crate) async fn start_service<R: Runtime>(app: AppHandle<R>) -> Result<ServiceStartResult> {
    app.android_services().start_service()
}

#[command]
pub(crate) async fn stop_service<R: Runtime>(app: AppHandle<R>) -> Result<ServiceStopResult> {
    app.android_services().stop_service()
}

#[command]
pub(crate) async fn is_running<R: Runtime>(app: AppHandle<R>) -> Result<ServiceStatus> {
    app.android_services().is_running()
}

#[command]
pub(crate) async fn execute_task<R: Runtime>(
    app: AppHandle<R>,
    payload: ExecuteTaskRequest,
) -> Result<TaskQueueResult> {
    app.android_services().execute_task(payload)
}

#[command]
pub(crate) async fn request_notifications_permission<R: Runtime>(
    app: AppHandle<R>,
) -> Result<NotificationsPermissionResult> {
    app.android_services().request_notifications_permission()
}
