const COMMANDS: &[&str] = &["ping", "start_service", "stop_service", "is_running", "execute_task", "request_notifications_permission"];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .build();
}
