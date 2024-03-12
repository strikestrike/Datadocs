export type DatadocsObjectNode = DatadocsFolderNode | DatadocsWorkbookNode;

export type DatadocsWorkbookNode = DatadocObjectBase & {
  type: "wb";
};

export type DatadocsFolderNode = DatadocObjectBase & {
  type: "fd";
};

type DatadocObjectBase = {
  id: string;
  parent: string;
  name: string;
  path?: string;
  ownerId?: string;
  creatorId?: string;
  createdAt?: number;
  updatedAt?: number;
  lastOpened?: number;
};
