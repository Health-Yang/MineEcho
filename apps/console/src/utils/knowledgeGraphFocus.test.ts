import assert from 'node:assert/strict';
import { buildFocusedGraphData } from './knowledgeGraphFocus';

const graph = {
  nodes: [
    { id: 'raw/current.md', label: 'Current', type: 'source', filePath: 'raw/current.md' },
    { id: 'concept-a', label: 'Concept A', type: 'topic', sources: ['raw/current.md'], importance: 80 },
    { id: 'neighbor-a', label: 'Neighbor A', type: 'entity', sources: ['wiki/sources/other.md'] },
    { id: 'other-only', label: 'Other Only', type: 'entity', sources: ['wiki/sources/other.md'] },
  ],
  edges: [
    { source: 'concept-a', target: 'neighbor-a', relation: 'relates_to' },
    { source: 'other-only', target: 'neighbor-a', relation: 'relates_to' },
  ],
  communities: [
    { id: 'topic', label: 'Topics', nodes: ['concept-a'], color: '#000' },
    { id: 'entity', label: 'Entities', nodes: ['neighbor-a', 'other-only'], color: '#111' },
    { id: 'source', label: 'Sources', nodes: ['raw/current.md'], color: '#222' },
  ],
};

const focused = buildFocusedGraphData(graph);

assert.equal(focused.sourcePath, 'raw/current.md');
assert.deepEqual(
  focused.graph.nodes.map((node) => node.id).sort(),
  ['concept-a', 'neighbor-a', 'raw/current.md']
);
assert.deepEqual(focused.graph.edges, [
  { source: 'concept-a', target: 'neighbor-a', relation: 'relates_to' },
]);
assert.equal(focused.hiddenCount, 1);
assert.deepEqual(
  focused.graph.communities.map((community) => [community.id, community.nodes]),
  [
    ['topic', ['concept-a']],
    ['entity', ['neighbor-a']],
    ['source', ['raw/current.md']],
  ]
);

console.log('knowledgeGraphFocus tests passed');
