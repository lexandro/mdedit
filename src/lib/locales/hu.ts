// Hungarian UI strings.
export const hu: Record<string, string> = {
  // Menus
  "menu.file": "Fájl",
  "menu.edit": "Szerkesztés",
  "menu.view": "Nézet",
  "menu.help": "Súgó",
  "menu.openRecent": "Legutóbbiak",
  "menu.noRecent": "(nincs előzmény)",

  // Commands
  "cmd.new": "Új",
  "cmd.open": "Megnyitás…",
  "cmd.save": "Mentés",
  "cmd.save_as": "Mentés másként…",
  "cmd.save_all": "Összes mentése",
  "cmd.export_html": "HTML exportálása…",
  "cmd.export_pdf": "PDF exportálása…",
  "cmd.close_tab": "Lap bezárása",
  "cmd.reopen_closed": "Bezárt lap újranyitása",
  "cmd.quit": "Kilépés",
  "cmd.clear_recent": "Előzmények törlése",
  "cmd.undo": "Visszavonás",
  "cmd.redo": "Mégis",
  "cmd.cut": "Kivágás",
  "cmd.copy": "Másolás",
  "cmd.paste": "Beillesztés",
  "cmd.select_all": "Összes kijelölése",
  "cmd.goto_line": "Ugrás sorra…",
  "cmd.insert_table": "Táblázat beszúrása",
  "cmd.insert_emoji": "Emoji beszúrása…",
  "cmd.format_tables": "Táblázatok formázása",
  "cmd.copy_html": "Másolás HTML-ként",
  "cmd.toggle_orientation": "Megosztás irányának váltása",
  "cmd.toggle_outline": "Vázlat ki/be",
  "cmd.toggle_word_wrap": "Sortörés ki/be",
  "cmd.settings": "Beállítások…",
  "cmd.check_updates": "Frissítés keresése…",
  "cmd.changelog": "Változásnapló",
  "cmd.about": "A mdedit névjegye",

  // View modes
  "view.source": "Forrás",
  "view.split": "Megosztott",
  "view.preview": "Előnézet",

  // Toolbar tooltips
  "tip.new": "Új (Ctrl+N)",
  "tip.open": "Megnyitás (Ctrl+O)",
  "tip.save": "Mentés (Ctrl+S)",
  "tip.save_as": "Mentés másként (Ctrl+Shift+S)",
  "tip.bold": "Félkövér (Ctrl+B)",
  "tip.italic": "Dőlt (Ctrl+I)",
  "tip.code": "Beágyazott kód",
  "tip.link": "Hivatkozás (Ctrl+K)",
  "tip.heading": "Címsor",
  "tip.bullet": "Felsorolás",
  "tip.quote": "Idézet",
  "tip.table": "Táblázat beszúrása",
  "tip.toggle_orientation": "Megosztás irányának váltása",
  "tip.settings": "Beállítások",
  "tip.formatting": "Formázás",
  "tip.viewMode": "Nézet",

  // Status bar
  "status.modified": "● Módosítva",
  "status.saved": "Mentve",
  "status.toggleEnding": "Sorvég váltása",
  "status.lncol": "{line}. sor, {col}. oszlop",
  "status.words": "{n} szó",
  "status.chars": "{n} karakter",
  "status.read": "~{n} perc olvasás",

  // Empty state
  "empty.noFile": "Nincs megnyitott fájl.",
  "empty.new": "Új fájl",
  "empty.open": "Fájl megnyitása…",
  "empty.recent": "Előzmények",
  "empty.clear": "Törlés",
  "empty.pin": "Rögzítés",
  "empty.unpin": "Rögzítés feloldása",
  "empty.hint": "Ctrl+N új · Ctrl+O megnyitás · Ctrl+S mentés · Ctrl+1/2/3 nézet",

  // Settings dialog
  "settings.title": "Beállítások",
  "settings.close": "Bezárás",
  "settings.theme": "Téma",
  "settings.uiSize": "Felület mérete",
  "settings.uiSizeHint":
    "Az egész felületet méretezi — menü, eszköztár, lapok, szerkesztő és előnézet.",
  "settings.fontSize": "Szerkesztő betűmérete",
  "settings.previewDelay": "Előnézet frissítési késleltetése",
  "settings.previewDelayHint":
    "Mennyivel a gépelés abbahagyása után frissül az előnézet (0 = azonnal).",
  "settings.defaultView": "Alapértelmezett nézet",
  "settings.splitOrientation": "Megosztás iránya",
  "settings.startup": "Indítási ablak",
  "settings.maximized": "Teljes méret",
  "settings.normal": "Normál",
  "settings.reset": "Alaphelyzet",
  "settings.language": "Nyelv",
  "settings.decUi": "Felület méretének csökkentése",
  "settings.incUi": "Felület méretének növelése",
  "settings.decFont": "Betűméret csökkentése",
  "settings.incFont": "Betűméret növelése",
  "settings.decDelay": "Késleltetés csökkentése",
  "settings.incDelay": "Késleltetés növelése",
  "theme.light": "Világos",
  "theme.dark": "Sötét",
  "theme.system": "Rendszer",
  "orientation.vertical": "Függőleges",
  "orientation.horizontal": "Vízszintes",

  // About dialog
  "about.version": "Verzió: {v}",
  "about.tagline": "Gyors, natív Windows Markdown-szerkesztő — Tauri 2 + Svelte.",
  "about.repo": "GitHub tároló",
  "about.releases": "Kiadások",
  "about.license": "Licenc (MIT)",
  "about.check": "Frissítés keresése",
  "about.copyright": "© 2026 lexandro · MIT licenc",

  // Changelog
  "changelog.title": "Változásnapló",

  // Outline
  "outline.title": "Vázlat",
  "outline.empty": "Nincsenek címsorok",

  // Command palette
  "palette.placeholder": "Parancs beírása…",
  "palette.empty": "Nincs találat",

  // Emoji picker
  "emoji.placeholder": "Emoji keresése (pl. smile, heart)…",
  "emoji.empty": "Nincs találat",

  // Go to line
  "goto.title": "Ugrás sorra",
  "goto.placeholder": "Sorszám",

  // Tab context menu
  "tab.close": "Bezárás",
  "tab.closeOthers": "Többi bezárása",
  "tab.closeRight": "Bezárás jobbra",
  "tab.copyPath": "Útvonal másolása",
  "tab.reveal": "Tartalmazó mappa megnyitása",

  // Updater
  "update.checking": "Frissítés keresése…",
  "update.downloading": "{v} letöltése és telepítése…",
  "update.uptodate": "Naprakész vagy.",
  "update.error": "A frissítés keresése sikertelen: {msg}",
  "update.available": "Elérhető frissítés —",
  "update.install": "Telepítés és újraindítás",
  "update.later": "Később",

  // Toasts
  "toast.exportedHtml": "HTML exportálva",
  "toast.exportHtmlFail": "A HTML exportálása sikertelen",
  "toast.copiedHtml": "Másolva HTML-ként",
  "toast.copiedHtmlPlain": "Másolva HTML-ként (egyszerű szöveg)",
  "toast.copyFail": "A másolás sikertelen",
  "toast.pdfFail": "A PDF exportálása sikertelen",
  "toast.openFail": "A fájl nem nyitható meg",
  "toast.openFailName": "A(z) {name} nem nyitható meg",
  "toast.saveFailName": "A(z) {name} nem menthető",
  "toast.pathCopied": "Útvonal másolva",
  "toast.copyPathFail": "Az útvonal nem másolható",
  "toast.pasteImageFail": "A beillesztett kép nem menthető",

  // Accessibility (screen-reader labels)
  "a11y.notifications": "Értesítések",
  "a11y.dismiss": "Bezárás",

  // Confirm dialogs
  "confirm.fileChangedTitle": "A fájl megváltozott a lemezen",
  "confirm.unsavedTitle": "Nem mentett változások",
  "confirm.reloadDiscard":
    "A(z) „{name}” fájlt egy másik program módosította.\nÚjratöltöd, eldobva a nem mentett változtatásokat?",
  "confirm.reload": "A(z) „{name}” fájlt egy másik program módosította.\nÚjratöltöd?",
  "confirm.discard": "Eldobod a(z) „{name}” nem mentett változtatásait?",
};
