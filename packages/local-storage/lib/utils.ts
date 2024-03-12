export async function dumpOPFS(root?: FileSystemDirectoryHandle, depth = 0) {
  if (!root) root = await navigator.storage.getDirectory();

  const indent = new Array(depth + 1).fill(' ').join('');
  for await (const [key, entry] of root.entries()) {
    if (entry.kind === 'directory') {
      console.log(`${indent}+ ${key}`);
      dumpOPFS(entry, depth + 1);
      continue;
    }

    let log = `${indent}- ${key}`;
    try {
      const file = await entry.getFile();
      const mtime = new Date(file.lastModified).toJSON();
      log += `(size=${file.size}; mtime=${mtime})`;
    } catch (error) {
      // noop
    }
    console.log(log);
  }
}
