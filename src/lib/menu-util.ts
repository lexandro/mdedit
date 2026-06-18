// Pure helper for Alt-key menu mnemonics: find the menu whose access key (its
// first letter) matches a pressed key. Returns -1 if none match.
export function mnemonicIndex(labels: string[], key: string): number {
  const k = key.toLowerCase();
  return labels.findIndex((label) => label[0]?.toLowerCase() === k);
}
