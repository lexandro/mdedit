// Headless UI smoke test: drives the built app in real Chromium (the engine the
// WebView2 runs) over CDP. Catches what jsdom cannot — real key handling, real
// layout, real scrolling. No window appears; CI can run it too.
//
//   bun run smoke            (builds first: bun run build)
//
// Tauri-only behaviour (file IO, watcher, menus) is out of scope here; those
// stay covered by unit tests.
import { Page, until } from "./cdp";

const PORT = Number(process.env.SMOKE_PORT ?? 4183);
const CDP_PORT = Number(process.env.SMOKE_CDP_PORT ?? 9333);
const results: string[] = [];
let failed = 0;

function check(name: string, ok: boolean, detail: string) {
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}\n        ${detail}`);
  if (!ok) failed++;
}

// Serve the build in-process: a child dev-server would outlive a killed parent
// on Windows and then serve a stale index against the next build.
const server = Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",
  async fetch(req) {
    const path = new URL(req.url).pathname;
    const file = Bun.file(`build${path === "/" ? "/index.html" : path}`);
    return (await file.exists()) ? new Response(file) : new Response(Bun.file("build/index.html"));
  },
});
const stopServer = () => server.stop(true);

const tmp = `${process.env.TEMP ?? "/tmp"}/mdedit-smoke-${process.pid}`;
const page = await Page.launch(`http://127.0.0.1:${PORT}/`, CDP_PORT, tmp);
await page.send("Runtime.enable");
// Smooth scrolling is animated, and headless Chrome does not always run the
// animation to completion (CI stalls it a few pixels in). Reduced motion makes
// every scroll land instantly, so a measurement means the same thing everywhere.
await page.send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});
// Without Tauri there is no restored session, so the app shows its empty state.
await until("the empty state", () => page.eval("!!document.querySelector('.empty-actions button')"));
await page.click(".empty-actions button"); // "New file"
try {
  await until("the editor", () => page.eval("!!document.querySelector('.cm-content')"));
} catch (e) {
  // A step that never arrives is usually a page error; show it instead of a bare timeout.
  const seen = await page
    .eval<string>(
      `[...document.querySelectorAll('.app *')].slice(0, 40)
         .map(el => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''))
         .join(' ') + ' || text: ' + document.body.innerText.slice(0, 200)`,
    )
    .catch(() => "?");
  console.error(`${e}\n--- page errors ---\n${page.errors.join("\n") || "(none)"}\n--- dom ---\n${seen}`);
  await page.close();
  stopServer();
  process.exit(1);
}

/** Replace the whole buffer with `text` (Ctrl+A, then type). */
async function setDoc(text: string) {
  await page.click(".cm-content");
  await page.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "a",
    code: "KeyA",
    windowsVirtualKeyCode: 65,
    modifiers: 2, // Ctrl
  });
  await page.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "a",
    code: "KeyA",
    windowsVirtualKeyCode: 65,
    modifiers: 2,
  });
  await page.type(text);
}

const lineText = (n: number) =>
  page.eval<string>(`document.querySelectorAll('.cm-line')[${n}]?.textContent ?? ''`);

// 1. Tab types at the cursor, it does not shove the line.
{
  await setDoc("- item");
  for (let i = 0; i < 2; i++) await page.key("ArrowLeft", "ArrowLeft", 37); // "- it|em"
  await page.key("Tab", "Tab", 9);
  const line = await lineText(0);
  check("Tab types at the cursor", line === "- it    em", `line = ${JSON.stringify(line)}`);
}

// 2. Tab at the start of a list item nests it under the previous sibling.
{
  await setDoc("- first\n- second");
  for (let i = 0; i < 6; i++) await page.key("ArrowLeft", "ArrowLeft", 37); // before "second"
  await page.key("Tab", "Tab", 9);
  const line = await lineText(1);
  check("Tab nests a list item", line === "  - second", `line = ${JSON.stringify(line)}`);
}

const filler = (tag: string) =>
  Array.from({ length: 60 }, (_, i) => `${tag} filler line ${i + 1}.`).join("\n\n");

const previewTop = () => page.eval<number>("document.querySelector('.preview').scrollTop");

/** Wait for a preview measurement to stop changing. Wrapped in an object so a
 *  settled value of 0 still reads as an answer. */
const settle = (expr: string) =>
  until(
    "the preview to settle",
    async () => {
      const a = await page.eval<number>(expr);
      await Bun.sleep(150);
      return a === (await page.eval<number>(expr)) ? { value: a } : null;
    },
    8000,
  ).then((r) => r.value);

// 3. An anchor link scrolls the preview to its heading.
{
  // Filler *after* the heading too: at the very end of the document the pane
  // simply cannot scroll the heading up to its top edge.
  await setDoc(
    `[Jump](#target-heading)\n\n${filler("Before")}\n\n# Target heading\n\n${filler("After")}`,
  );
  await until("the preview to render", () =>
    page.eval("!!document.querySelector('.preview a[href^=\"#\"]')"),
  );
  const before = await previewTop();
  await page.click('.preview a[href^="#"]');
  // Smooth scrolling is animated: wait for the position to stop moving, or the
  // heading gets measured mid-flight.
  const after = await until(
    "the scroll to settle",
    async () => {
      const a = await previewTop();
      await Bun.sleep(150);
      const b = await previewTop();
      return a === b && b > 0 ? b : null;
    },
    8000,
  ).catch(() => 0);
  // How far the heading sits from the top of the pane once everything settles.
  const offset = await page.eval<number | null>(
    `(() => { const h = document.querySelector('.preview #target-heading');
       if (!h) return null;
       return Math.round(h.getBoundingClientRect().top
              - document.querySelector('.preview').getBoundingClientRect().top); })()`,
  );
  // Guard the measurement itself: at the very end of a document the pane cannot
  // scroll a heading to its top, which would fail for a reason that isn't a bug.
  const maxScroll = await page.eval<number>(
    `(() => { const p = document.querySelector('.preview'); return p.scrollHeight - p.clientHeight; })()`,
  );
  // "At the top" allows the pane's 24px padding plus the heading's own top
  // margin; what matters is that it isn't left mid-pane or below the fold.
  check(
    "Anchor link scrolls the preview to its heading",
    before === 0 && after > 0 && after < maxScroll && offset !== null && Math.abs(offset) <= 100,
    `scrollTop ${before} -> ${after} (max ${maxScroll}), heading offset from pane top: ${offset}px`,
  );
}

// 4. The mouse side buttons retrace an anchor jump.
{
  await setDoc(
    `[Jump](#target-heading)\n\n${filler("Before")}\n\n# Target heading\n\n${filler("After")}`,
  );
  await until("the preview to render", () =>
    page.eval("!!document.querySelector('.preview a[href^=\"#\"]')"),
  );
  // The pane re-renders (debounced Markdown) after it first paints, and the
  // browser then re-anchors the scroll. Measuring before that lands leaves the
  // reference position drifting, which is a test bug, not a product one.
  await settle("document.querySelector('.preview').scrollHeight");
  const press = async (button: "back" | "forward") => {
    for (const type of ["mousePressed", "mouseReleased"]) {
      await page.send("Input.dispatchMouseEvent", {
        type,
        x: 400,
        y: 400,
        button,
        buttons: type === "mousePressed" ? (button === "back" ? 8 : 16) : 0,
        clickCount: 1,
      });
    }
    return settle("document.querySelector('.preview').scrollTop");
  };
  // Block 3 left the pane scrolled; start this one from the top.
  await page.eval("document.querySelector('.preview').scrollTop = 0");
  const before = await settle("document.querySelector('.preview').scrollTop");
  await page.click('.preview a[href^="#"]');
  const jumped = await settle("document.querySelector('.preview').scrollTop");
  const backTo = await press("back");
  const fwdTo = await press("forward");
  check(
    "Mouse back/forward retrace the anchor jump",
    before === 0 && jumped > 0 && backTo === 0 && Math.abs(fwdTo - jumped) <= 2,
    `scrollTop ${before} -> jump ${jumped} -> back ${backTo} -> forward ${fwdTo}`,
  );
}

// 5. A menu opened with Alt takes the arrow keys: they walk the menu, not the
// caret behind it, and Escape hands the keyboard back to the editor.
{
  await setDoc(`alpha
bravo
charlie`);
  const lnCol = () =>
    page.eval<string>(
      `[...document.querySelectorAll('.statusbar span')]
         .map((s) => s.textContent).find((t) => t.startsWith('Ln')) ?? ''`,
    );
  const altKey = async (key: string, code: string, keyCode: number) => {
    for (const type of ["keyDown", "keyUp"]) {
      await page.send("Input.dispatchKeyEvent", {
        type,
        key,
        code,
        windowsVirtualKeyCode: keyCode,
        modifiers: 1, // Alt
      });
    }
  };

  const atEnd = await lnCol();
  await page.key("ArrowUp", "ArrowUp", 38); // positive control: the probe follows the caret
  const parked = await lnCol();

  await altKey("v", "KeyV", 86);
  await until("the View menu", () => page.eval("!!document.querySelector('.dropdown')"));
  await page.key("ArrowDown", "ArrowDown", 40);
  await page.key("ArrowDown", "ArrowDown", 40);
  const row = await page.eval<string>(
    "document.querySelector('.dropdown .item.active')?.textContent.trim() ?? ''",
  );
  const after = await lnCol();
  await page.key("Escape", "Escape", 27);
  const refocused = await page.eval<boolean>(
    "!!document.activeElement?.classList.contains('cm-content')",
  );
  check(
    "An Alt-opened menu takes the arrow keys",
    parked !== atEnd && row.startsWith("Split") && after === parked && refocused,
    `caret ${atEnd} -> ${parked} -> ${after}, active row = ${JSON.stringify(row)}, refocused: ${refocused}`,
  );
}

// 6. A theme flip re-themes the Mermaid diagrams that are already on screen, in
// the preview and in Live mode (whose widgets a theme change alone never rebuilds).
{
  await setDoc("```mermaid\ngraph TD\n  A[Alpha] --> B[Bravo]\n```\n");
  // Await the app's own data-theme, not just the emulated media query: switching
  // view modes before the app has reacted would measure the wrong theme.
  const setDark = async (dark: boolean) => {
    await page.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-color-scheme", value: dark ? "dark" : "light" },
        { name: "prefers-reduced-motion", value: "reduce" },
      ],
    });
    const want = dark ? "dark" : "light";
    await until(`the ${want} theme`, () =>
      page.eval(`document.documentElement.getAttribute('data-theme') === '${want}'`),
    );
  };
  const ctrl = async (key: string, code: string, keyCode: number) => {
    for (const type of ["keyDown", "keyUp"]) {
      await page.send("Input.dispatchKeyEvent", {
        type,
        key,
        code,
        windowsVirtualKeyCode: keyCode,
        modifiers: 2, // Ctrl
      });
    }
  };
  // A diagram node's fill comes from Mermaid's theme and is baked into the SVG at
  // render time, so it moves only if the SVG was really re-rendered.
  const fill = (scope: string) =>
    page.eval<string>(
      `(() => { const r = document.querySelector('${scope} svg .node rect, ${scope} svg rect');
         return r ? getComputedStyle(r).fill : ''; })()`,
    );
  const seen: Record<string, string> = {};
  for (const [name, scope, mode] of [
    ["preview", ".preview pre.mermaid", 2],
    ["live", ".cm-lp-mermaid", 4],
  ] as const) {
    await setDark(false);
    await ctrl(String(mode), `Digit${mode}`, 48 + mode);
    await until(
      `the ${name} diagram`,
      () => page.eval(`!!document.querySelector('${scope} svg')`),
      30000,
    );
    const light = await fill(scope);
    await setDark(true);
    // Re-rendering is async (Mermaid import + render). Fall back to the unchanged
    // colour so a regression reports the colour instead of a bare timeout.
    const dark = await until(
      `the ${name} diagram to re-theme`,
      async () => {
        const f = await fill(scope);
        return f && f !== light ? f : null;
      },
      8000,
    ).catch(() => light);
    seen[`${name} light`] = light;
    seen[`${name} dark`] = dark;
  }
  await setDark(false);
  check(
    "A theme flip re-themes rendered Mermaid diagrams",
    Object.values(seen).every(Boolean) &&
      seen["preview light"] !== seen["preview dark"] &&
      seen["live light"] !== seen["live dark"] &&
      seen["preview dark"] === seen["live dark"],
    Object.entries(seen)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", "),
  );
}

console.log(`\n${results.join("\n")}\n`);
await page.close();
stopServer();
process.exit(failed === 0 ? 0 : 1);
