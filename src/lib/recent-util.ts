// Pure ordering for the recent-files list: pinned entries first (in pin order),
// then the rest of the recents, de-duplicated.
export interface RecentEntry {
  path: string;
  pinned: boolean;
}

export function orderedRecent(paths: string[], pinned: string[]): RecentEntry[] {
  const pinnedSet = new Set(pinned);
  return [
    ...pinned.map((path) => ({ path, pinned: true })),
    ...paths.filter((p) => !pinnedSet.has(p)).map((path) => ({ path, pinned: false })),
  ];
}
