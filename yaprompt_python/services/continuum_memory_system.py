"""
Continuum Memory System (Python Port)
Inspired by Hope architecture from Google's Nested Learning paper

Key Features:
- Surprise-based memory prioritization
- Infinite context window through hierarchical compression
- Memory consolidation over time
- Fast retrieval using embeddings (TF-IDF / Vector)
- Persistent storage via File/SQLite (using a simple JSON store for now for portability)
"""

import time
import json
import math
import os
import random
import uuid
import heapq
from typing import List, Dict, Any, Optional, Tuple, Set
from pydantic import BaseModel, Field

# Constants
DB_FILE = "continuum_memory.json"
MAX_MEMORIES = 10000
CONSOLIDATION_THRESHOLD = 8000

# ============================================================================
# TYPE DEFINITIONS
# ============================================================================

class MemoryMetadata(BaseModel):
    timestamp: float
    accessCount: int = 0
    lastAccessed: float
    level: Optional[int] = 0
    context: Optional[str] = None
    extra: Dict[str, Any] = {}

class Memory(BaseModel):
    id: str
    data: Any
    surpriseScore: float
    embedding: Optional[List[float]] = None
    metadata: MemoryMetadata
    compressed: bool = False
    parentId: Optional[str] = None

class MemoryCluster(BaseModel):
    id: str
    centroid: List[float]
    memories: List[str]  # Memory IDs
    surpriseScore: float
    level: int

class MemoryStore(BaseModel):
    memories: Dict[str, Memory] = {}
    clusters: Dict[str, MemoryCluster] = {}

# ============================================================================
# CONTINUUM MEMORY SYSTEM
# ============================================================================

class ContinuumMemorySystem:
    def __init__(self, db_path: str = DB_FILE):
        self.db_path = db_path
        self.store = MemoryStore()
        self._load_db()

    def _load_db(self):
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    # Simple loading, pydantic parsing might be slow for large dumps
                    self.store = MemoryStore(**data)
            except Exception as e:
                print(f"Failed to load memory DB, starting fresh: {e}")
        else:
            print("No existing memory DB found, starting fresh.")

    def _save_db(self):
        try:
            with open(self.db_path, "w", encoding="utf-8") as f:
                f.write(self.store.model_dump_json(indent=2))
        except Exception as e:
            print(f"Failed to save memory DB: {e}")

    # ========================================================================
    # CORE STORAGE METHODS
    # ========================================================================

    async def store_memory(self, data: Any, surprise_score: float, metadata: Dict[str, Any] = None) -> str:
        memory_id = str(uuid.uuid4())
        embedding = self._generate_embedding(data)
        
        meta = metadata or {}
        memory = Memory(
            id=memory_id,
            data=data,
            surpriseScore=surprise_score,
            embedding=embedding,
            metadata=MemoryMetadata(
                timestamp=time.time(),
                lastAccessed=time.time(),
                **meta
            )
        )

        self.store.memories[memory_id] = memory
        
        # Periodic saving/consolidation
        if len(self.store.memories) > CONSOLIDATION_THRESHOLD:
            await self.consolidate()
        else:
            self._save_db() # Save on every write for safety in this version
            
        return memory_id

    async def retrieve(self, query: Any, limit: int = 10, min_surprise: float = 0, 
                       max_age_ms: Optional[float] = None, level: Optional[int] = None, 
                       context: Optional[str] = None) -> List[Memory]:
        
        candidates = []
        now = time.time()
        
        query_embedding = self._generate_embedding(query)
        
        for mem in self.store.memories.values():
            if mem.surpriseScore < min_surprise:
                continue
            if max_age_ms and (now - mem.metadata.timestamp) * 1000 > max_age_ms:
                continue
            if level is not None and mem.metadata.level != level:
                continue
            if context and mem.metadata.context != context:
                continue
            
            candidates.append(mem)
            
        # Calculate similarity and scores
        scored_candidates = []
        for mem in candidates:
            sim = self._cosine_similarity(query_embedding, mem.embedding) if mem.embedding else 0
            # Score = Similarity * Surprise (prioritize relevance and novelty)
            score = sim * mem.surpriseScore
            scored_candidates.append((score, mem))
            
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        top_memories = [x[1] for x in scored_candidates[:limit]]
        
        # Update access counts
        for mem in top_memories:
            mem.metadata.accessCount += 1
            mem.metadata.lastAccessed = now
            
        self._save_db()
        return top_memories

    # ========================================================================
    # MEMORY CONSOLIDATION
    # ========================================================================

    async def consolidate(self):
        print("🧠 Consolidating continuum memory...")
        all_memories = list(self.store.memories.values())
        
        # Calculate retention scores
        scored = []
        for mem in all_memories:
            score = self._calculate_retention_score(mem)
            scored.append((score, mem))
            
        scored.sort(key=lambda x: x[0], reverse=True)
        
        target_count = int(MAX_MEMORIES * 0.7)
        compression_start = int(MAX_MEMORIES * 0.7)
        compression_end = int(MAX_MEMORIES * 0.9)
        
        to_keep = scored[:compression_start]
        to_compress = scored[compression_start:compression_end]
        # to_delete = scored[compression_end:] 
        # Implicitly deleted by not including in new dict, but we need to remove from dict
        
        # 1. Delete
        indices_to_keep = set([x[1].id for x in to_keep])
        indices_to_compress = set([x[1].id for x in to_compress])
        
        # Pruning
        new_memories_dict = {}
        for mem_id, mem in self.store.memories.items():
            if mem_id in indices_to_keep:
                new_memories_dict[mem_id] = mem
            elif mem_id in indices_to_compress:
                # Will be compressed
                new_memories_dict[mem_id] = mem
        
        self.store.memories = new_memories_dict

        # 2. Compress
        memories_to_cluster = [x[1] for x in to_compress]
        if memories_to_cluster:
            await self._compress_memories(memories_to_cluster)

        print(f"✅ Consolidation complete. Total memories: {len(self.store.memories)}")
        self._save_db()

    def _calculate_retention_score(self, memory: Memory) -> float:
        age_ms = (time.time() - memory.metadata.timestamp) * 1000
        age_days = age_ms / (1000 * 60 * 60 * 24)
        
        recency_score = math.exp(-age_days / 30)
        frequency_score = min(memory.metadata.accessCount / 10, 1.0)
        surprise_score = memory.surpriseScore
        
        return (surprise_score * 0.4 + recency_score * 0.3 + frequency_score * 0.3)

    async def _compress_memories(self, memories: List[Memory]):
        if not memories:
            return
            
        k = max(len(memories) // 10, 1)
        clusters = self._cluster_memories(memories, k)
        
        for cluster_info in clusters:
            cluster_id = str(uuid.uuid4())
            member_ids = [m.id for m in cluster_info['members']]
            surprises = [m.surpriseScore for m in cluster_info['members']]
            new_level = cluster_info['members'][0].metadata.level or 0
            
            cluster = MemoryCluster(
                id=cluster_id,
                centroid=cluster_info['centroid'],
                memories=member_ids,
                surpriseScore=max(surprises) if surprises else 0,
                level=new_level
            )
            
            self.store.clusters[cluster_id] = cluster
            
            # Mark simple memories as compressed
            for mem in cluster_info['members']:
                mem.compressed = True
                mem.parentId = cluster_id
                # In a real DB we might move these to "cold storage"

    def _cluster_memories(self, memories: List[Memory], k: int) -> List[Dict]:
        if not memories:
            return []
            
        # Simple K-Means
        # Init centroids
        centroids = []
        for _ in range(k):
            m = random.choice(memories)
            centroids.append(m.embedding or [0]*128)
            
        clusters = []
        for _ in range(10): # max iterations
            clusters = [{'centroid': c, 'members': []} for c in centroids]
            
            for mem in memories:
                if not mem.embedding: continue
                
                best_idx = 0
                min_dist = float('inf')
                
                for i, c in enumerate(centroids):
                    dist = self._euclidean_distance(mem.embedding, c)
                    if dist < min_dist:
                        min_dist = dist
                        best_idx = i
                        
                clusters[best_idx]['members'].append(mem)
                
            # Update centroids
            changed = False
            for i, cluster in enumerate(clusters):
                if not cluster['members']: continue
                
                new_centroid = self._calculate_centroid([m.embedding for m in cluster['members'] if m.embedding])
                if self._euclidean_distance(new_centroid, centroids[i]) > 0.01:
                    changed = True
                    centroids[i] = new_centroid
                    
            if not changed:
                break
                
        return [c for c in clusters if c['members']]

    # ========================================================================
    # HELPERS
    # ========================================================================

    def _generate_embedding(self, data: Any) -> List[float]:
        text = str(data).lower()
        words = text.split()[:100]
        
        # Simple hashing vectorizer
        embedding = [0.0] * 128
        for word in words:
            h = hash(word) % 128
            embedding[h] += 1.0
            
        # Normalize
        norm = math.sqrt(sum(x*x for x in embedding))
        if norm > 0:
            embedding = [x/norm for x in embedding]
            
        return embedding

    def _cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b: return 0.0
        dot = sum(a*b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a*a for a in vec_a))
        norm_b = math.sqrt(sum(b*b for b in vec_b))
        if norm_a == 0 or norm_b == 0: return 0.0
        return dot / (norm_a * norm_b)

    def _euclidean_distance(self, vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b: return float('inf')
        return math.sqrt(sum((a-b)**2 for a, b in zip(vec_a, vec_b)))

    def _calculate_centroid(self, vectors: List[List[float]]) -> List[float]:
        if not vectors: return []
        dim = len(vectors[0])
        count = len(vectors)
        centroid = [0.0] * dim
        for v in vectors:
            for i in range(dim):
                centroid[i] += v[i]
        return [x/count for x in centroid]


# Singleton instance
continuum_memory_system = ContinuumMemorySystem()
