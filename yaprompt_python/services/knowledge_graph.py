"""
Knowledge Graph Service (Python Port)
Personal knowledge graph with automatic enrichment
"""

import time
import uuid
import heapq
from typing import List, Dict, Set, Optional, Any
from pydantic import BaseModel

# ============================================================================
# TYPE DEFINITIONS
# ============================================================================

class KnowledgeNode(BaseModel):
    id: str
    type: str # concept, fact, person, place, document, topic
    label: str
    description: str
    confidence: float
    source: str
    timestamp: float
    metadata: Dict[str, Any]

class KnowledgeEdge(BaseModel):
    id: str
    from_node: str
    to_node: str
    relationship: str
    weight: float
    timestamp: float

# ============================================================================
# KNOWLEDGE GRAPH
# ============================================================================

class KnowledgeGraph:
    def __init__(self):
        self.nodes: Dict[str, KnowledgeNode] = {}
        self.edges: Dict[str, KnowledgeEdge] = {}
        self.node_index: Dict[str, Set[str]] = {}

    async def add_node(self, node_data: Dict[str, Any]) -> KnowledgeNode:
        node = KnowledgeNode(
            id=str(uuid.uuid4()),
            **node_data,
            timestamp=time.time()
        )
        self.nodes[node.id] = node
        self._index_node(node)
        
        # Auto-enrich (mock)
        # await self._auto_enrich(node.id)
        
        return node

    async def add_edge(self, from_id: str, to_id: str, rel: str, weight: float = 1.0) -> KnowledgeEdge:
        edge = KnowledgeEdge(
            id=str(uuid.uuid4()),
            from_node=from_id,
            to_node=to_id,
            relationship=rel,
            weight=weight,
            timestamp=time.time()
        )
        self.edges[edge.id] = edge
        return edge

    def search(self, term: str, limit: int = 20) -> List[KnowledgeNode]:
        term = term.lower()
        results = set()
        
        for idx_term, node_ids in self.node_index.items():
            if term in idx_term or idx_term in term:
                results.update(node_ids)
                
        nodes = [self.nodes[nid] for nid in results if nid in self.nodes]
        nodes.sort(key=lambda x: x.confidence, reverse=True)
        return nodes[:limit]
    
    def get_stats(self) -> Dict[str, Any]:
        return {
            "totalNodes": len(self.nodes),
            "totalEdges": len(self.edges),
            "avgConnections": len(self.edges) / max(len(self.nodes), 1)
        }

    def _index_node(self, node: KnowledgeNode):
        terms = f"{node.label} {node.description}".lower().split()
        for term in terms:
            if len(term) < 3: continue
            if term not in self.node_index:
                self.node_index[term] = set()
            self.node_index[term].add(node.id)

knowledge_graph = KnowledgeGraph()
