type TabData = {
  id: string;
  name: string;
  isActive: boolean;
};

export function makeRandomId(len = 10): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charsLength = chars.length;
  let id = "";

  for (let i = 0; i < len; i++) {
    const pos = Math.floor(Math.random() * (charsLength - 1));
    id += chars.charAt(pos);
  }

  return id;
}

export function isUnique(value: string, existedValue: string[]): boolean {
  return existedValue.indexOf(value) === -1;
}

export function getUniqueId(existedIds: string[]): string {
  let id = "";

  while (!id) {
    const tempId: string = makeRandomId();

    if (isUnique(tempId, existedIds)) {
      id = tempId;
      break;
    }
  }

  return id;
}

export function getUniqueTabName<T extends TabData>(
  proposedName: string,
  tabs: T[],
  excludingId?: string
): string {
  const existingNames = tabs
    .filter((t) => t.id !== excludingId)
    .map((t) => t.name);

  if (isUnique(proposedName, existingNames)) {
    return proposedName;
  }

  let newName: string;
  let count = 0;

  do {
    count += 1;
    newName = proposedName + " " + count;
  } while (!isUnique(newName, existingNames));

  return newName;
}

export function switchTab<T extends TabData>(tabs: T[], id: string): T[] {
  tabs.forEach((t) => {
    t.isActive = id === t.id;
  });

  return tabs;
}

export function removeTab<T extends TabData>(tabs: T[], id: string): T[] {
  const index = tabs.findIndex((t) => t.id === id);
  if (index === -1 || tabs.length === 1) return;
  const tab = tabs[index];
  if (tab.isActive) {
    if (index === 0) {
      tabs[index + 1].isActive = true;
    } else {
      tabs[index - 1].isActive = true;
    }
  }
  tabs.splice(index, 1);
  return tabs;
}

export function addTab<T extends TabData>(
  newTab: T,
  tabs: T[],
  index: number
): T[] {
  tabs.splice(index, 0, newTab);
  switchTab(tabs, newTab.id);
  return tabs;
}

export function isTabNameUnique<T extends TabData>(
  tabs: T[],
  name: string,
  excludeId: string
): boolean {
  return (
    tabs
      .filter((t) => t.id !== excludeId)
      .map((t) => t.name)
      .indexOf(name) === -1
  );
}
