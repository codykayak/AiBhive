/** Hive Cloud (server Firecrawl/Serp + credits) is always on — no user toggle. */
export async function loadUseHiveCloudIntel(): Promise<boolean> {
  return true;
}

export async function saveUseHiveCloudIntel(_enabled: boolean): Promise<void> {
  // no-op — Hive Cloud cannot be disabled
}
