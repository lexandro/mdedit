import { describe, it, expect } from "vitest";
import { EditorState, EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { wrapSelection } from "./md-format";

function mkView(doc: string, anchor: number, head = anchor): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  return new EditorView({
    parent,
    state: EditorState.create({ doc, selection: EditorSelection.single(anchor, head) }),
  });
}

describe("wrapSelection", () => {
  it("wraps the whole word when the cursor is inside it (no selection)", () => {
    const view = mkView("proba", 3); // prob|a
    wrapSelection(view, "**");
    expect(view.state.doc.toString()).toBe("**proba**");
    view.destroy();
  });

  it("toggles the word off on a second press (the reported bug)", () => {
    const view = mkView("proba", 3);
    wrapSelection(view, "**"); // -> **proba**
    wrapSelection(view, "**"); // cursor still within the word -> remove
    expect(view.state.doc.toString()).toBe("proba");
    view.destroy();
  });

  it("removes an empty marker pair instead of nesting more", () => {
    const view = mkView("****", 2); // **|**
    wrapSelection(view, "**");
    expect(view.state.doc.toString()).toBe("");
    view.destroy();
  });

  it("wraps and unwraps an explicit selection", () => {
    const view = mkView("a proba b", 2, 7); // select "proba"
    wrapSelection(view, "*");
    expect(view.state.doc.toString()).toBe("a *proba* b");
    wrapSelection(view, "*");
    expect(view.state.doc.toString()).toBe("a proba b");
    view.destroy();
  });
});
