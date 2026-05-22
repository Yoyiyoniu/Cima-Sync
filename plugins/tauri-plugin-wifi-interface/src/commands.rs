use tauri::{command, AppHandle, Runtime};

use crate::models::*;
use crate::Result;
use crate::WifiInterfaceExt;

#[command]
pub(crate) async fn bind_to_wifi<R: Runtime>(app: AppHandle<R>) -> Result<BindResult> {
    app.wifi_interface().bind_to_wifi()
}

#[command]
pub(crate) async fn unbind_network<R: Runtime>(app: AppHandle<R>) -> Result<BindResult> {
    app.wifi_interface().unbind_network()
}

#[command]
pub(crate) async fn get_wifi_status<R: Runtime>(app: AppHandle<R>) -> Result<WifiStatus> {
    app.wifi_interface().get_wifi_status()
}

#[command]
pub(crate) async fn start_observing<R: Runtime>(app: AppHandle<R>) -> Result<ObserveResult> {
    app.wifi_interface().start_observing()
}

#[command]
pub(crate) async fn stop_observing<R: Runtime>(app: AppHandle<R>) -> Result<ObserveResult> {
    app.wifi_interface().stop_observing()
}
