const COMMANDS: &[&str] = &["ping", "bind_to_wifi", "unbind_network", "get_wifi_status"];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .build();
}
