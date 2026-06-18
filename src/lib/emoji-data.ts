// The same emoji shortcode set markdown-it-emoji renders, so the picker and the
// preview agree on names. Built once from the plugin's "full" data.
import data from "markdown-it-emoji/lib/data/full.mjs";
import type { Emoji } from "$lib/emoji-search";

export const emojiList: Emoji[] = Object.entries(data as Record<string, string>).map(
  ([shortcode, char]) => ({ shortcode, char }),
);
