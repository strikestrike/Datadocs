import type { DoublyLinkedNode } from '../types';

/**
 * Used as a fast way to access the sibling touching a given border.
 */
export const dirToLinkedNodeKeys = {
  top: 'upperSibling',
  left: 'prevSibling',
  bottom: 'lowerSibling',
  right: 'nextSibling',
};

/**
 * Get surrounding nodes of a node
 * @param node
 * @returns List of surrounding nodes with clockwise order
 */
export function getSurroundingNodes<T>(
  node: DoublyLinkedNode<T>,
): DoublyLinkedNode<T>[] {
  const topNode = getAdjacentNode(node, 'top');
  const bottomNode = getAdjacentNode(node, 'bottom');
  const leftNode = getAdjacentNode(node, 'left');
  const rightNode = getAdjacentNode(node, 'right');
  const topLeftNode = getAdjacentNode(topNode, 'left');
  const topRightNode = getAdjacentNode(topNode, 'right');
  const bottomLeftNode = getAdjacentNode(bottomNode, 'left');
  const bottomRightNode = getAdjacentNode(bottomNode, 'right');
  return [
    topLeftNode,
    topNode,
    topRightNode,
    rightNode,
    bottomRightNode,
    bottomNode,
    bottomLeftNode,
    leftNode,
  ];
}

/**
 * Get adjacent node at @position
 * @param node
 * @param position
 * @returns
 */
export function getAdjacentNode<T>(
  node: DoublyLinkedNode<T>,
  position: keyof typeof dirToLinkedNodeKeys,
): DoublyLinkedNode<T> {
  if (!node) return node;
  return node[dirToLinkedNodeKeys[position]];
}
