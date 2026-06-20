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

// --- Windows .md file association ----------------------------------------
// Report whether mdedit is the effective handler for `.md`, and self-register
// (HKCU, no admin). Windows won't let an app force the user's default app
// (UserChoice is hash-protected), so registration sets the classic association
// and adds us to "Open with"; a conflicting UserChoice still needs the user to
// pick mdedit in Windows settings.
#[cfg(windows)]
const MD_EXTS: [&str; 5] = ["md", "markdown", "mdown", "mkd", "mdx"];
#[cfg(windows)]
const PROG_ID: &str = "mdedit.md";

#[cfg(windows)]
fn current_exe_string() -> Result<String, String> {
    std::env::current_exe()
        .map_err(|e| e.to_string())
        .map(|p| p.to_string_lossy().to_string())
}

/// The open-command string Windows would use for `.md`, if any.
#[cfg(windows)]
fn md_open_command() -> Option<String> {
    use winreg::enums::{HKEY_CLASSES_ROOT, HKEY_CURRENT_USER};
    use winreg::RegKey;
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    // UserChoice wins on modern Windows; otherwise the classic association.
    let prog_id = hkcu
        .open_subkey(r"Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.md\UserChoice")
        .and_then(|k| k.get_value::<String, _>("ProgId"))
        .ok()
        .or_else(|| {
            hkcu.open_subkey(r"Software\Classes\.md")
                .and_then(|k| k.get_value::<String, _>(""))
                .ok()
        })?;
    let cmd_path = format!(r"{}\shell\open\command", prog_id);
    hkcu.open_subkey(format!(r"Software\Classes\{}", cmd_path))
        .and_then(|k| k.get_value::<String, _>(""))
        .ok()
        .or_else(|| {
            RegKey::predef(HKEY_CLASSES_ROOT)
                .open_subkey(&cmd_path)
                .and_then(|k| k.get_value::<String, _>(""))
                .ok()
        })
}

/// "registered" if `.md` opens in this exe, "unregistered" otherwise,
/// "unsupported" off Windows.
#[tauri::command]
fn md_association_status() -> String {
    #[cfg(windows)]
    {
        let exe = match current_exe_string() {
            Ok(e) => e.to_lowercase(),
            Err(_) => return "unsupported".into(),
        };
        match md_open_command() {
            Some(cmd) if cmd.to_lowercase().contains(&exe) => "registered".into(),
            _ => "unregistered".into(),
        }
    }
    #[cfg(not(windows))]
    "unsupported".into()
}

#[tauri::command]
fn register_md_association() -> Result<(), String> {
    #[cfg(windows)]
    {
        use winreg::enums::HKEY_CURRENT_USER;
        use winreg::RegKey;
        let exe = current_exe_string()?;
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);

        let (prog, _) = hkcu
            .create_subkey(format!(r"Software\Classes\{}", PROG_ID))
            .map_err(|e| e.to_string())?;
        prog.set_value("", &"Markdown Document")
            .map_err(|e| e.to_string())?;
        prog.create_subkey("DefaultIcon")
            .and_then(|(k, _)| k.set_value("", &format!("\"{}\",0", exe)))
            .map_err(|e| e.to_string())?;
        prog.create_subkey(r"shell\open\command")
            .and_then(|(k, _)| k.set_value("", &format!("\"{}\" \"%1\"", exe)))
            .map_err(|e| e.to_string())?;

        for ext in MD_EXTS {
            let (ext_key, _) = hkcu
                .create_subkey(format!(r"Software\Classes\.{}", ext))
                .map_err(|e| e.to_string())?;
            ext_key.set_value("", &PROG_ID).map_err(|e| e.to_string())?;
            ext_key
                .create_subkey("OpenWithProgIDs")
                .and_then(|(k, _)| k.set_value(PROG_ID, &""))
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }
    #[cfg(not(windows))]
    Err("unsupported".into())
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
            take_launch_files,
            md_association_status,
            register_md_association
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
