use std::path::Path;
use std::sync::Mutex;

use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use tauri::menu::{MenuBuilder, SubmenuBuilder};
use tauri::{Emitter, Manager};

/// Holds the filesystem watcher so commands can (un)watch open files.
struct WatcherState(Mutex<RecommendedWatcher>);

#[tauri::command]
fn watch_file(path: String, state: tauri::State<WatcherState>) -> Result<(), String> {
    state
        .0
        .lock()
        .map_err(|e| e.to_string())?
        .watch(Path::new(&path), RecursiveMode::NonRecursive)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn unwatch_file(path: String, state: tauri::State<WatcherState>) -> Result<(), String> {
    state
        .0
        .lock()
        .map_err(|e| e.to_string())?
        .unwatch(Path::new(&path))
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build());

    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .plugin(tauri_plugin_process::init());
    }

    builder
        .invoke_handler(tauri::generate_handler![watch_file, unwatch_file])
        .setup(|app| {
            // --- Filesystem watcher: emit "file-changed" when an open file is
            // modified or recreated on disk. The frontend decides whether to
            // reload or prompt.
            let handle = app.handle().clone();
            let watcher = notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
                if let Ok(event) = res {
                    if matches!(event.kind, EventKind::Modify(_) | EventKind::Create(_)) {
                        for p in event.paths {
                            let _ = handle.emit("file-changed", p.to_string_lossy().to_string());
                        }
                    }
                }
            })?;
            app.manage(WatcherState(Mutex::new(watcher)));

            // --- Native menu bar. Custom items emit a "menu" event to the
            // frontend; keyboard shortcuts are handled there (no accelerators
            // here, to avoid double-firing). Edit uses predefined webview actions.
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
