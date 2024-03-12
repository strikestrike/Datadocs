import { uploadedFileExist } from "../../../../../app/store/db-manager/uploaded-files";
import { getFileExtension } from "../../../../../app/store/db-manager/utils";
import { uploadedFile } from "../../../../../app/store/store-db";
import { uploadedFileActions } from "../../manager/action";
import uploadedFileStateManager, {
  insertFileToUploadedFiles,
} from "../../manager/uploadedFileStateManager";

/** random value */
const openFilePickerId = "2ff9627e724841bb9631b373a537277f";

const csvType: FilePickerAcceptType = {
  description: "CSV",
  accept: { "text/csv": [".csv"] },
};
const parquetFile: FilePickerAcceptType = {
  description: "Apache Parquet",
  accept: { "application/vnd.apache.parquet": [".parquet"] },
};

const acceptTypes = [
  "text/csv",
  "application/vnd.apache.parquet",
  "application/json",
];

/**
 * Function to upload file from file picker
 * @param parent
 */
export function handleUploadFile(parent: string) {
  _handleUploadFile(parent).catch((e) => {
    console.error(e);
  });
}

/**
 * Show file picker and upload load file system
 * @param parent
 * @returns
 */
async function _handleUploadFile(parent: string) {
  const files = await window.showOpenFilePicker({
    multiple: true,
    id: openFilePickerId,
    types: [csvType, parquetFile],
  });
  if (files.length <= 0) return;
  // const [file] = files;
  for (const entry of files) {
    await handleProcessUploadFile(entry, parent);
  }
}

/**
 * handle Upload folder from picker
 * @param parent
 */
export function handleUploadFolder(parent: string) {
  _handleUploadFolder(parent).catch((e) => {
    console.log(e);
  });
}

/**
 * handle process insert file to duckdb and uploaded file manager
 * @param entry
 * @param parent
 * @returns
 */
async function handleProcessUploadFile(
  entry: FileSystemFileHandle,
  parent: string
) {
  const fileName = entry.name;
  if (await uploadedFileExist(fileName, parent)) {
    return;
  }

  const file = await entry.getFile();
  if (!acceptTypes.includes(file.type)) {
    return;
  }
  const fullName = await uploadedFile(file);
  if (fullName) {
    await insertFileToUploadedFiles(
      fileName,
      fullName,
      getFileExtension(file),
      parent
    );
  }
}

/**
 * Handle upload folder to duckdb and uploaded file manager
 * @param dirHandle
 * @param parentId
 */
async function handleProcessUploadFolder(
  dirHandle: FileSystemDirectoryHandle,
  parentId: string
) {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") {
      await handleProcessUploadFile(entry, parentId);
    } else if (entry.kind === "directory") {
      await handleAddFolder(entry, parentId);
    }
  }
}

/**
 * Handle create new node for folder and it's content
 * @param entry
 * @param parentId
 */
async function handleAddFolder(
  entry: FileSystemDirectoryHandle,
  parentId: string
) {
  await uploadedFileActions.addNewNode(entry.name, "folder", parentId);
  const folder = uploadedFileStateManager.getNodeByName(entry.name, parentId);
  if (folder) {
    await handleProcessUploadFolder(entry, folder.id);
  }
}

/**
 * Show folder picker and upload folder
 * @param parent
 */
async function _handleUploadFolder(parent: string) {
  const handle = await window.showDirectoryPicker();
  await handleAddFolder(handle, parent);
}

/**
 * Handle upload files and folders for drop files event
 * @param e
 */
export async function handleDropFileFolder(e: DragEvent) {
  const supportsFileSystemAccessAPI =
    "getAsFileSystemHandle" in DataTransferItem.prototype;
  const supportsWebkitGetAsEntry =
    "webkitGetAsEntry" in DataTransferItem.prototype;
  const fileHandlesPromises = [...e.dataTransfer.items]
    // …by including only files (where file misleadingly means actual file _or_
    // directory)…
    .filter((item) => item.kind === "file")
    // …and, depending on previous feature detection…
    .map((item) =>
      supportsFileSystemAccessAPI
        ? // …either get a modern `FileSystemHandle`…
          item.getAsFileSystemHandle()
        : // …or a classic `FileSystemFileEntry`.
          item.webkitGetAsEntry()
    );
  const root = uploadedFileStateManager.getUIRoot();
  for await (const handle of fileHandlesPromises) {
    // This is where we can actually exclusively act on the directories.
    const folderHandle = handle as FileSystemDirectoryHandle;
    if (folderHandle.kind === "directory") {
      await handleAddFolder(folderHandle, root ? root.id : null);
    } else {
      await handleProcessUploadFile(
        handle as FileSystemFileHandle,
        root ? root.id : null
      );
    }
  }
}
