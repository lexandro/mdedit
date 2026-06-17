use std::path::Path;
use std::sync::Mutex;

use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use tauri::{Emitter, Manager};

/// Holds the filesystem watcher so commands can (un)watch open files.
struct WatcherState(Mutex<RecommendedWatcher>);

/// Files passed on the command line at launch (e.g. via "Open with"), consumed
/// once by the frontend after it mounts.
struct LaunchFiles(Mutex<Vec<String>>);

/// Pick the real, existing file paths out of a process argv (skipping flags).
fn files_from_args(args: &[String]) -> Vec<String> {
    args.iter()
        .filter(|a| !a.starts_with('-'))
        .filter(|a| Path::new(a).is_file())
        .cloned()
        .collect()
}

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

/// Return (and clear) the files this instance was launched with.
#[tauri::command]
fn take_launch_files(state: tauri::State<LaunchFiles>) -> Vec<String> {
    state
        .0
        .lock()
        .map(|mut g| std::mem::take(&mut *g))
        .unwrap_or_default()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_files = files_from_args(&std::env::args().skip(1).collect::<Vec<_>>());

    let mut builder = tauri::Builder::default();

    // Single-instance must be the first plugin: a second launch (e.g. opening
    // another file) forwards its argv here instead of spawning a new window.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            let files = files_from_args(argv.get(1..).unwrap_or(&[]));
            if !files.is_empty() {
                let _ = app.emit("open-files", files);
            }
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_focus();
            }
        }));
    }

    builder = builder
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
        .invoke_handler(tauri::generate_handler![
            watch_file,
            unwatch_file,
            take_launch_files
        ])
        .setup(move |app| {
            app.manage(LaunchFiles(Mutex::new(initial_files)));

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

            // No native menu: the app renders its own in-app menu bar (see
            // MenuBar.svelte) so it scales with the UI zoom and matches the theme.
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
