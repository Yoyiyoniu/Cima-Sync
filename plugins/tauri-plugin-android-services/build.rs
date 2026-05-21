const COMMANDS: &[&str] = &["ping", "start_service", "stop_service", "is_running", "execute_task"];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .build();
}
