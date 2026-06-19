<script lang="ts">
  import {
    settings,
    ZOOM_MIN,
    ZOOM_MAX,
    ZOOM_STEP,
    FONT_MIN,
    FONT_MAX,
    DEBOUNCE_MIN,
    DEBOUNCE_MAX,
    DEBOUNCE_STEP,
    type ThemeChoice,
    type ViewMode,
    type SplitOrientation,
    type Language,
  } from "$lib/stores/settings.svelte";
  import { t } from "$lib/i18n";

  let { onClose }: { onClose: () => void } = $props();

  const themes: ThemeChoice[] = ["light", "dark", "system"];
  const modes: ViewMode[] = ["source", "split", "preview"];
  const orientations: SplitOrientation[] = ["vertical", "horizontal"];
  const languages: { id: Language; label: string }[] = [
    { id: "en", label: "English" },
    { id: "hu", label: "Magyar" },
  ];

  type TabId = "general" | "appearance" | "editor" | "preview";
  const tabs: { id: TabId; key: string }[] = [
    { id: "general", key: "settings.tab.general" },
    { id: "appearance", key: "settings.tab.appearance" },
    { id: "editor", key: "settings.tab.editor" },
    { id: "preview", key: "settings.tab.preview" },
  ];
  let tab = $state<TabId>("general");
</script>

<div
  class="backdrop"
  role="button"
  tabindex="0"
  onclick={onClose}
  onkeydown={(e) => e.key === "Escape" && onClose()}
></div>
<div class="dialog" role="dialog" aria-modal="true" aria-label={t("settings.title")}>
  <header>
    <h2>{t("settings.title")}</h2>
    <button class="x" onclick={onClose} aria-label={t("settings.close")}>×</button>
  </header>

  <div class="layout">
    <div class="tabs" role="tablist">
      {#each tabs as tb (tb.id)}
        <button
          role="tab"
          aria-selected={tab === tb.id}
          class:active={tab === tb.id}
          onclick={() => (tab = tb.id)}>{t(tb.key)}</button
        >
      {/each}
    </div>

    <div class="panel" role="tabpanel">
      {#if tab === "general"}
        <section>
          <h3>{t("settings.language")}</h3>
          <div class="seg">
            {#each languages as l (l.id)}
              <button
                class:active={settings.language === l.id}
                onclick={() => settings.setLanguage(l.id)}>{l.label}</button
              >
            {/each}
          </div>
        </section>

        <section>
          <h3>{t("settings.startup")}</h3>
          <div class="seg">
            <button
              class:active={settings.startupMaximized}
              onclick={() => settings.setStartupMaximized(true)}>{t("settings.maximized")}</button
            >
            <button
              class:active={!settings.startupMaximized}
              onclick={() => settings.setStartupMaximized(false)}>{t("settings.normal")}</button
            >
          </div>
        </section>
      {:else if tab === "appearance"}
        <section>
          <h3>{t("settings.theme")}</h3>
          <div class="seg">
            {#each themes as th (th)}
              <button class:active={settings.theme === th} onclick={() => settings.setTheme(th)}
                >{t(`theme.${th}`)}</button
              >
            {/each}
          </div>
        </section>

        <section>
          <h3>{t("settings.uiSize")}</h3>
          <div class="stepper">
            <button
              aria-label={t("settings.decUi")}
              disabled={settings.uiZoom <= ZOOM_MIN}
              onclick={() => settings.setUiZoom(settings.uiZoom - ZOOM_STEP)}>−</button
            >
            <span class="value">{Math.round(settings.uiZoom * 100)}%</span>
            <button
              aria-label={t("settings.incUi")}
              disabled={settings.uiZoom >= ZOOM_MAX}
              onclick={() => settings.setUiZoom(settings.uiZoom + ZOOM_STEP)}>+</button
            >
            <button class="reset" onclick={() => settings.setUiZoom(1)}>{t("settings.reset")}</button>
          </div>
          <p class="hint">{t("settings.uiSizeHint")}</p>
        </section>
      {:else if tab === "editor"}
        <section>
          <h3>{t("settings.fontSize")}</h3>
          <div class="stepper">
            <button
              aria-label={t("settings.decFont")}
              disabled={settings.editorFontSize <= FONT_MIN}
              onclick={() => settings.setEditorFontSize(settings.editorFontSize - 1)}>−</button
            >
            <span class="value">{settings.editorFontSize}px</span>
            <button
              aria-label={t("settings.incFont")}
              disabled={settings.editorFontSize >= FONT_MAX}
              onclick={() => settings.setEditorFontSize(settings.editorFontSize + 1)}>+</button
            >
            <button class="reset" onclick={() => settings.setEditorFontSize(14)}
              >{t("settings.reset")}</button
            >
          </div>
        </section>
      {:else if tab === "preview"}
        <section>
          <h3>{t("settings.defaultView")}</h3>
          <div class="seg">
            {#each modes as m (m)}
              <button
                class:active={settings.defaultViewMode === m}
                onclick={() => settings.setDefaultViewMode(m)}>{t(`view.${m}`)}</button
              >
            {/each}
          </div>
        </section>

        <section>
          <h3>{t("settings.splitOrientation")}</h3>
          <div class="seg">
            {#each orientations as o (o)}
              <button
                class:active={settings.splitOrientation === o}
                onclick={() => settings.setSplitOrientation(o)}>{t(`orientation.${o}`)}</button
              >
            {/each}
          </div>
        </section>

        <section>
          <h3>{t("settings.previewDelay")}</h3>
          <div class="stepper">
            <button
              aria-label={t("settings.decDelay")}
              disabled={settings.previewDebounceMs <= DEBOUNCE_MIN}
              onclick={() => settings.setPreviewDebounceMs(settings.previewDebounceMs - DEBOUNCE_STEP)}
              >−</button
            >
            <span class="value">{settings.previewDebounceMs} ms</span>
            <button
              aria-label={t("settings.incDelay")}
              disabled={settings.previewDebounceMs >= DEBOUNCE_MAX}
              onclick={() => settings.setPreviewDebounceMs(settings.previewDebounceMs + DEBOUNCE_STEP)}
              >+</button
            >
            <button class="reset" onclick={() => settings.setPreviewDebounceMs(100)}
              >{t("settings.reset")}</button
            >
          </div>
          <p class="hint">{t("settings.previewDelayHint")}</p>
        </section>
      {/if}
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 10;
  }
  .dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(560px, 92vw);
    max-height: min(80vh, 560px);
    display: flex;
    flex-direction: column;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 10px;
    z-index: 11;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border);
  }
  h2 {
    font-size: 16px;
    margin: 0;
  }
  .x {
    border: none;
    background: transparent;
    color: var(--fg-muted);
    font-size: 20px;
    cursor: pointer;
  }
  .layout {
    display: flex;
    flex: 1;
    min-height: 0; /* let the panel scroll instead of growing the dialog */
  }
  .tabs {
    flex: 0 0 130px;
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 2px;
    border-right: 1px solid var(--border);
    background: var(--bg-alt);
    overflow-y: auto;
  }
  .tabs button {
    border: none;
    background: transparent;
    color: var(--fg);
    text-align: left;
    padding: 7px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }
  .tabs button:hover {
    background: var(--border);
  }
  .tabs button.active {
    background: var(--accent);
    color: var(--accent-fg);
  }
  .panel {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 4px 20px 20px;
  }
  h3 {
    font-size: 13px;
    color: var(--fg-muted);
    margin: 16px 0 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .seg {
    display: flex;
    gap: 4px;
  }
  .seg button {
    flex: 1;
    border: 1px solid var(--border);
    background: var(--bg-alt);
    color: var(--fg);
    padding: 6px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }
  .seg button.active {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);
  }
  .stepper {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .stepper button {
    border: 1px solid var(--border);
    background: var(--bg-alt);
    color: var(--fg);
    width: 30px;
    height: 30px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
  }
  .stepper button:hover:not(:disabled) {
    border-color: var(--accent);
  }
  .stepper button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .stepper .value {
    min-width: 52px;
    text-align: center;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }
  .stepper .reset {
    width: auto;
    padding: 0 10px;
    font-size: 12px;
    margin-left: 4px;
  }
  .hint {
    font-size: 12px;
    color: var(--fg-muted);
    margin: 8px 0 0;
  }
</style>
