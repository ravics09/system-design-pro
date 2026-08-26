import type { CommentNode, CommentView } from '../comments/comments.dto';

export type Comparator = (a: CommentView, b: CommentView) => number;

export const byNewest: Comparator = (a, b) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

export const byTop: Comparator = (a, b) => b.score - a.score || byNewest(a, b);

/**
 * Assemble a flat list of comments into nested trees IN MEMORY (O(n)).
 *
 * 1. Index every node by id, giving each a `children: []`.
 * 2. Attach each node to its parent's `children` (via `parentId`); nodes whose
 *    parent isn't in the set become roots.
 * 3. Sort roots and every `children` array with the comparator.
 *
 * `rootOrder` (the ids of the paginated top-level comments, in order) pins the
 * root ordering to the DB pagination; deeper levels use the comparator.
 */
export function assembleForest(
  flat: CommentView[],
  comparator: Comparator,
  rootOrder?: string[],
): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  for (const c of flat) byId.set(c.id, { ...c, children: [] });

  const roots: CommentNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  for (const node of byId.values()) node.children.sort(comparator);

  if (rootOrder) {
    const rank = new Map(rootOrder.map((id, i) => [id, i]));
    roots.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  } else {
    roots.sort(comparator);
  }
  return roots;
}
