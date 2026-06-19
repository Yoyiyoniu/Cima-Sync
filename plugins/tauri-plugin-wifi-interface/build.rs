const COMMANDS: &[&str] = &[
    "ping",
    "bind_to_wifi",
    "unbind_network",
    "get_wifi_status",
    "connect_to_network",
];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .build();
}
