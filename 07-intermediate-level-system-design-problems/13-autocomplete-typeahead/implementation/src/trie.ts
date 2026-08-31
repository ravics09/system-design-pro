export interface Suggestion {
  term: string;
  weight: number;
}

class TrieNode {
  children = new Map<string, TrieNode>();
  isWord = false;
  weight = 0; // popularity of the word ending here
  term = '';
}

/**
 * Prefix tree for autocomplete. `insert` adds/updates a term's weight; `topK` walks to the
 * prefix node (O(prefix length)) then collects completions ranked by weight. In production
 * you'd precompute a cached top-k list per node — here we collect on demand (small corpus).
 */
export class Trie {
  private root = new TrieNode();

  insert(term: string, weight = 1): void {
    const t = term.toLowerCase();
    let node = this.root;
    for (const ch of t) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch)!;
    }
    node.isWord = true;
    node.term = t;
    node.weight = weight;
  }

  /** Increment a term's popularity (e.g., on search). */
  bump(term: string, by = 1): void {
    const node = this.nodeFor(term.toLowerCase());
    if (node?.isWord) node.weight += by;
    else this.insert(term, by);
  }

  private nodeFor(prefix: string): TrieNode | null {
    let node = this.root;
    for (const ch of prefix) {
      const next = node.children.get(ch);
      if (!next) return null;
      node = next;
    }
    return node;
  }

  topK(prefix: string, k = 5): Suggestion[] {
    const start = this.nodeFor(prefix.toLowerCase());
    if (!start) return [];
    const found: Suggestion[] = [];
    const stack: TrieNode[] = [start];
    while (stack.length) {
      const node = stack.pop()!;
      if (node.isWord) found.push({ term: node.term, weight: node.weight });
      for (const child of node.children.values()) stack.push(child);
    }
    found.sort((a, b) => b.weight - a.weight || a.term.localeCompare(b.term));
    return found.slice(0, k);
  }
}
