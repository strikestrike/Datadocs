import { DefaultNamespaceController } from "@datadocs/canvas-datagrid-ng/lib/data/namespace/default-controller";

const rootNsController = new DefaultNamespaceController();

export function getRootNamespace() {
  return rootNsController;
}
