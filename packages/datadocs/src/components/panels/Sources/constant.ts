import type {
  DataNodeBase,
  Node,
} from "../../common/file-system/fileSystemStateManager";

export const GROUP_ROOT_DATABASE_NAME = "DATABASES";
export const GROUP_ROOT_UPLOADED_FILES_NAME = "QUERYABLE FILES";
export const DATABASE_SOURCE_PANEL_ACTION_CONTEXT =
  "database::source::panel::action::context";
export const DATABASE_STATE_MANAGER_CONTEXT = "database::stateManager::context";
export const UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT =
  "uploadedFiles::source::panel::action::context";
export const UPLOADED_FILES_STATE_MANAGER_CONTEXT =
  "uploadedFiles::stateManager::context";
export const DETAIL_TRANSFORM_CONTEXT = "source::transform::context";
export const UPLOADED_FILES_MAX_ROOT_ITEMS = 10;

export const FILE_SYSTEM_VIEW_ALL_FILES_ID = "show_all_files";
export const FILE_SYSTEM_VIEW_ALL_FILES_ITEM: Node<DataNodeBase> = {
  id: FILE_SYSTEM_VIEW_ALL_FILES_ID,
  name: "View all files >",
  type: FILE_SYSTEM_VIEW_ALL_FILES_ID,
  dataNode: {
    id: FILE_SYSTEM_VIEW_ALL_FILES_ID,
    type: "folder",
    name: "View all files >",
    parent: null,
  },
  children: null,
  parent: null,
};

export const MANAGED_FILE_DATABASE_SCHEMA_NAME = "managed_files";
export const DEFAULT_DATABASE_SCHEMA_NAME = "main";
export const INTERNAL_SCHEMA_NAME = "internals";

export const DETAIL_MIN_HEIGHT = 200;
export const DETAIL_MIN_WIDTH = 156;
export const DETAIL_DEFAUT_HEIGHT = 500;
