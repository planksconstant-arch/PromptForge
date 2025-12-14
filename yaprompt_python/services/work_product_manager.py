import json
import asyncio
import time
from typing import List, Optional, Dict, Union, Any
from pathlib import Path
import aiofiles

from ..types import WorkProduct, WorkProductMetadata
from ..config import Config

class WorkProductManager:
    def __init__(self):
        pass

    async def save_work_product(self, work_product: WorkProduct) -> None:
        """
        Save a work product to disk as a JSON file.
        """
        filename = f"{work_product.id}.json"
        file_path = Config.WORK_PRODUCTS_DIR / filename
        
        # Serialize with Pydantic
        data = work_product.model_dump()
        
        async with aiofiles.open(file_path, 'w') as f:
            await f.write(json.dumps(data, indent=2))

    async def get_work_product(self, product_id: str) -> Optional[WorkProduct]:
        """
        Get single work product by ID.
        """
        file_path = Config.WORK_PRODUCTS_DIR / f"{product_id}.json"
        if not file_path.exists():
            return None
            
        async with aiofiles.open(file_path, 'r') as f:
            content = await f.read()
            data = json.loads(content)
            return WorkProduct(**data)

    async def get_all_work_products(self) -> List[WorkProduct]:
        """
        Get all work products from disk.
        """
        products = []
        # List all .json files in work products dir
        files = list(Config.WORK_PRODUCTS_DIR.glob("*.json"))
        
        for file_path in files:
            try:
                async with aiofiles.open(file_path, 'r') as f:
                    content = await f.read()
                    data = json.loads(content)
                    products.append(WorkProduct(**data))
            except Exception as e:
                print(f"Failed to load work product {file_path}: {e}")
                
        return products

    async def get_filtered_work_products(self, filter_criteria: Dict[str, Any]) -> List[WorkProduct]:
        products = await self.get_all_work_products()
        
        agent_id = filter_criteria.get('agentId')
        fmt = filter_criteria.get('format')
        date_from = filter_criteria.get('dateFrom')
        date_to = filter_criteria.get('dateTo')
        search_term = filter_criteria.get('searchTerm')
        
        if agent_id:
            products = [p for p in products if p.agentId == agent_id]
            
        if fmt:
            products = [p for p in products if p.format == fmt]
            
        if date_from:
            products = [p for p in products if p.metadata.timestamp >= date_from]
            
        if date_to:
            products = [p for p in products if p.metadata.timestamp <= date_to]
            
        if search_term:
            term = search_term.lower()
            products = [p for p in products if 
                        term in p.title.lower() or 
                        term in p.agentName.lower() or 
                        (isinstance(p.content, str) and term in p.content.lower())]
                        
        # Sort by timestamp desc
        products.sort(key=lambda p: p.metadata.timestamp, reverse=True)
        return products

    async def delete_work_product(self, product_id: str) -> bool:
        file_path = Config.WORK_PRODUCTS_DIR / f"{product_id}.json"
        if file_path.exists():
            file_path.unlink()
            return True
        return False

    async def delete_multiple(self, ids: List[str]) -> int:
        count = 0
        for pid in ids:
            if await self.delete_work_product(pid):
                count += 1
        return count

    async def get_by_agent(self, agent_id: str) -> List[WorkProduct]:
        return await self.get_filtered_work_products({'agentId': agent_id})
    
    async def get_recent(self, limit: int = 10) -> List[WorkProduct]:
        products = await self.get_all_work_products()
        products.sort(key=lambda p: p.metadata.timestamp, reverse=True)
        return products[:limit]

work_product_manager = WorkProductManager()
