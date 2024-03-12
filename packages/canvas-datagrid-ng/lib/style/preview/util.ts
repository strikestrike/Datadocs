import type { CellLinkedNode, GridPrivateProperties } from '../../types';

export function defineStylePreview(
  self: GridPrivateProperties,
  nodes: CellLinkedNode[],
) {
  if (self.stylePreviewManager.hasStylePreview()) {
    defineStylePreviewBorders(self, nodes);
  }
}

function defineStylePreviewBorders(
  self: GridPrivateProperties,
  nodes: CellLinkedNode[],
) {
  const manager = self.stylePreviewManager;
  for (const firstNode of nodes) {
    if (!firstNode || !firstNode.source || !firstNode.cell) continue;
    let curNode = firstNode;
    while (curNode) {
      const { cell } = curNode;
      const borders = manager.getCustomBorders(curNode);
      // keep custom border of cell if exist
      if (borders) cell.customBorders = { ...borders, ...cell.customBorders };
      curNode = curNode.nextSibling;
    }
  }
}
