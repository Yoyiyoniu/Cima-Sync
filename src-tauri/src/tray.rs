#[cfg(desktop)]
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    App, Manager,
};

#[cfg(desktop)]
pub fn system_tray(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let quit_i = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
    let toggle_i = MenuItem::with_id(app, "toggle", "Maximizar / Minimizar", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&toggle_i, &quit_i])?;

    TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "toggle" => {
                if let Some(window) = app.get_webview_window("main") {
                    let is_visible = window.is_visible().unwrap_or(false);
                    if is_visible {
                        let _ = window.set_focus();
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .icon(
            app.default_window_icon()
                .ok_or("No se encontró el ícono por defecto de la ventana")?
                .clone(),
        )
        .build(app)?;
    Ok(())
}
