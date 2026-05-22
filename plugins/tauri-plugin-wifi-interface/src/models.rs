use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BindResult {
    pub success: bool,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WifiStatus {
    pub is_bound: bool,
    pub ssid: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ObserveResult {
    pub status: String,
}

/// Evento emitido por Android ConnectivityManager.NetworkCallback.
/// Todos los campos opcionales están presentes según el tipo de evento:
/// - available / lost / unavailable: solo networkId
/// - capabilitiesChanged: todos los campos
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WifiEvent {
    pub event: String,
    pub network_id: Option<i64>,
    pub has_internet: Option<bool>,
    pub has_validated: Option<bool>,
    pub ssid: Option<String>,
    pub rssi: Option<i32>,
    pub link_speed: Option<i32>,
}
