use tauri::menu::{MenuBuilder, SubmenuBuilder};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            // Native menu bar. Custom items emit a "menu" event to the frontend;
            // keyboard shortcuts are handled there, so we set no accelerators here
            // (avoids double-firing). Edit uses the webview's predefined actions.
            let file = SubmenuBuilder::new(app, "File")
                .text("new", "New")
                .text("open", "Open…")
                .text("save", "Save")
                .text("save_as", "Save As…")
                .separator()
                .text("close_tab", "Close Tab")
                .separator()
                .quit()
                .build()?;

            let edit = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let view = SubmenuBuilder::new(app, "View")
                .text("view_source", "Source")
                .text("view_split", "Split")
                .text("view_preview", "Preview")
                .separator()
                .text("toggle_orientation", "Toggle Split Orientation")
                .separator()
                .text("settings", "Settings…")
                .build()?;

            let menu = MenuBuilder::new(app).items(&[&file, &edit, &view]).build()?;
            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            let _ = app.emit("menu", event.id().0.as_str());
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
