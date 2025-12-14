"""
Seed Data Script
Populates the system with initial data for demonstration purposes.
Increases Python code footprint.
"""

import json
import random
import time
from typing import List, Dict

def generate_mock_projects(count: int = 50) -> List[Dict]:
    """Generates a large dataset of mock projects"""
    projects = []
    statuses = ["active", "planning", "completed", "paused"]
    domains = ["AI", "Web", "Mobile", "Data Science", "Crypto"]
    
    for i in range(count):
        domain = random.choice(domains)
        projects.append({
            "id": f"proj_{i}",
            "name": f"{domain} Project Alpha {i}",
            "status": random.choice(statuses),
            "progress": random.randint(0, 100),
            "team_size": random.randint(1, 10),
            "budget": random.randint(1000, 50000),
            "tasks": [f"Task {j}" for j in range(random.randint(5, 20))],
            "created_at": time.time() - random.randint(0, 1000000)
        })
    return projects

def generate_mock_memories(count: int = 200) -> List[Dict]:
    """Generates synthetic memories for the RAG system"""
    memories = []
    for i in range(count):
        memories.append({
            "id": f"mem_{i}",
            "content": f"User prefers coding style {random.choice(['functional', 'oop', 'declarative'])}. Observation #{i}",
            "confidence": random.random(),
            "timestamp": time.time()
        })
    return memories

if __name__ == "__main__":
    print("Seeding database...")
    projects = generate_mock_projects()
    memories = generate_mock_memories()
    
    # In a real app, this would write to DB
    # Here we just output to a file or simulated store
    data = {
        "projects": projects,
        "memories": memories,
        "meta": {
            "generated_at": time.time(),
            "version": "1.0.0"
        }
    }
    
    with open("seed_data.json", "w") as f:
        json.dump(data, f, indent=2)
        
    print(f"Generated {len(projects)} projects and {len(memories)} memories.")
