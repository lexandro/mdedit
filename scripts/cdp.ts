// Minimal Chrome DevTools Protocol client: launch a headless Chrome, talk to a
// page over one WebSocket. Enough to drive the UI in a real browser engine
// (the same Chromium the WebView2 runs) without any extra dependency.

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

export function findChrome(): string {
  for (const p of CHROME_CANDIDATES) {
    if (p && Bun.file(p).size > 0) return p;
  }
  throw new Error("No Chrome found. Set CHROME_PATH.");
}

/** Poll `fn` until it returns something truthy, or throw after `ms`. */
export async function until<T>(what: string, fn: () => Promise<T>, ms = 20000): Promise<T> {
  const deadline = Date.now() + ms;
  for (;;) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {
      /* not ready yet */
    }
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${what}`);
    await Bun.sleep(120);
  }
}

export class Page {
  #ws: WebSocket;
  #proc: Bun.Subprocess;
  #next = 1;
  #pending = new Map<number, { ok: (v: any) => void; err: (e: Error) => void }>();

  /** Page errors seen so far — the first thing to look at when a step times out. */
  readonly errors: string[] = [];

  private constructor(ws: WebSocket, proc: Bun.Subprocess) {
    this.#ws = ws;
    this.#proc = proc;
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.method === "Runtime.exceptionThrown") {
        const d = msg.params.exceptionDetails;
        this.errors.push(d.exception?.description ?? d.text);
        return;
      }
      if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
        this.errors.push(msg.params.args.map((a: any) => a.description ?? a.value).join(" "));
        return;
      }
      const p = msg.id != null ? this.#pending.get(msg.id) : undefined;
      if (!p) return;
      this.#pending.delete(msg.id);
      if (msg.error) p.err(new Error(`${msg.error.message} (${JSON.stringify(msg.error.data)})`));
      else p.ok(msg.result);
    });
  }

  /** Launch headless Chrome on `port` and attach to its first page. */
  static async launch(url: string, port: number, userDataDir: string): Promise<Page> {
    const proc = Bun.spawn(
      [
        findChrome(),
        "--headless=new",
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${userDataDir}`,
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--window-size=1280,900",
        ...(process.env.CI ? ["--no-sandbox", "--disable-dev-shm-usage"] : []),
        url,
      ],
      { stdout: "ignore", stderr: "ignore" },
    );
    process.on("exit", () => proc.kill());

    const wsUrl = await until("the debugger endpoint", async () => {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      return targets.find((t: any) => t.type === "page")?.webSocketDebuggerUrl;
    });
    const ws = new WebSocket(wsUrl);
    await new Promise<void>((ok, err) => {
      ws.addEventListener("open", () => ok(), { once: true });
      ws.addEventListener("error", () => err(new Error("CDP socket failed")), { once: true });
    });
    return new Page(ws, proc);
  }

  /** Shut down the browser this Page launched (by handle, never by name). */
  async close() {
    try {
      this.#ws.close();
    } catch {
      /* already gone */
    }
    this.#proc.kill();
    await this.#proc.exited;
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<any> {
    const id = this.#next++;
    this.#ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, err) => this.#pending.set(id, { ok, err }));
  }

  /** Evaluate an expression in the page and return its JSON value. */
  async eval<T = unknown>(expression: string): Promise<T> {
    const r = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "eval failed");
    return r.result.value as T;
  }

  async key(key: string, code: string, keyCode: number, text?: string) {
    const base = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
    await this.send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", ...base, text });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
  }

  async type(text: string) {
    await this.send("Input.insertText", { text });
  }

  /** Click the centre of the first element matching `selector`. */
  async click(selector: string) {
    const box = await this.eval<{ x: number; y: number } | null>(
      `(() => { const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`,
    );
    if (!box) throw new Error(`No element matches ${selector}`);
    for (const type of ["mousePressed", "mouseReleased"]) {
      await this.send("Input.dispatchMouseEvent", {
        type,
        x: box.x,
        y: box.y,
        button: "left",
        clickCount: 1,
      });
    }
  }
}
