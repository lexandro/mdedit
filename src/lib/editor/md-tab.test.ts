import { describe, it, expect } from "vitest";
import { EditorState, EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { indentUnit } from "@codemirror/language";
import { mdTabKeymap } from "./md-tab";

const keys = mdTabKeymap(() => "spaces");
const tab = (v: EditorView) => keys[0].run!(v);
const shiftTab = (v: EditorView) => keys[0].shift!(v);

function mkView(doc: string, anchor: number, head = anchor): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  return new EditorView({
    parent,
    state: EditorState.create({
      doc,
      selection: EditorSelection.single(anchor, head),
      extensions: [indentUnit.of("    ")],
    }),
  });
}

describe("mdTabKeymap", () => {
  it("types at the cursor instead of moving the line (the reported bug)", () => {
    const view = mkView("- item", 4); // "- it|em" — column 4, next stop is 8
    tab(view);
    expect(view.state.doc.toString()).toBe("- it    em");
    expect(view.state.selection.main.head).toBe(8);
    view.destroy();
  });

  it("nests a list item when the cursor is before its content", () => {
    const view = mkView("- a\n- b", 4); // start of the second item
    tab(view);
    expect(view.state.doc.toString()).toBe("- a\n  - b");
    expect(view.state.selection.main.head).toBe(6); // after the new indent
    view.destroy();
  });

  it("outdents from inside the text, keeping the cursor on the same character", () => {
    const view = mkView("- a\n  - bcd", 9); // "  - b|cd"
    shiftTab(view);
    expect(view.state.doc.toString()).toBe("- a\n- bcd");
    expect(view.state.sliceDoc(view.state.selection.main.head)).toBe("cd");
    view.destroy();
  });

  it("replaces a selection inside one line", () => {
    const view = mkView("- item", 2, 6); // select "item"
    tab(view);
    expect(view.state.doc.toString()).toBe("-   ");
    view.destroy();
  });

  it("block-indents a selection spanning lines", () => {
    const view = mkView("one\ntwo", 1, 5);
    tab(view);
    expect(view.state.doc.toString()).toBe("    one\n    two");
    shiftTab(view);
    expect(view.state.doc.toString()).toBe("one\ntwo");
    view.destroy();
  });

  it("swallows Tab on the first item of a list", () => {
    const view = mkView("- a", 2);
    expect(tab(view)).toBe(true);
    expect(view.state.doc.toString()).toBe("- a");
    view.destroy();
  });
});
