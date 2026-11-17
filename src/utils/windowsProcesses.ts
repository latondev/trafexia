import type { WindowsProcess } from '../../shared/types';

/** Select matching executable instances and their descendants, not unrelated
 * programs that happen to use node.exe or another shared runtime. */
export function windowsProcessFamily(processes: WindowsProcess[], target: WindowsProcess): number[] {
  const family = new Set(processes.filter((item) => target.executablePath && item.executablePath
    ? item.executablePath.toLowerCase() === target.executablePath.toLowerCase()
    : item.name === target.name).map((item) => item.pid));
  family.add(target.pid);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of processes) {
      if (item.parentPid && family.has(item.parentPid) && !family.has(item.pid)) {
        family.add(item.pid);
        changed = true;
      }
    }
  }
  return [...family];
}
