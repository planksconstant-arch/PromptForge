import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Union
import aiofiles
from ..config import Config

class LocalStorage:
    def __init__(self):
        self.storage_file = Config.DATA_DIR / 'storage.json'
        self._cache: Dict[str, Any] = {}
        self._init_storage()

    def _init_storage(self):
        if not self.storage_file.exists():
            with open(self.storage_file, 'w') as f:
                json.dump({}, f)
                self._cache = {}
        else:
            try:
                with open(self.storage_file, 'r') as f:
                    self._cache = json.load(f)
            except json.JSONDecodeError:
                self._cache = {}

    async def get(self, keys: Union[str, List[str], None] = None) -> Dict[str, Any]:
        """
        Mimics chrome.storage.local.get
        """
        # Reload to capture external changes (simplistic approach)
        self._reload()
        
        if keys is None:
            return self._cache
        
        if isinstance(keys, str):
            keys = [keys]
            
        return {k: self._cache.get(k) for k in keys}

    async def set(self, items: Dict[str, Any]):
        """
        Mimics chrome.storage.local.set
        """
        self._reload()
        self._cache.update(items)
        await self._save()

    async def remove(self, keys: Union[str, List[str]]):
        self._reload()
        if isinstance(keys, str):
            keys = [keys]
        
        for k in keys:
            if k in self._cache:
                del self._cache[k]
        
        await self._save()

    def _reload(self):
        if self.storage_file.exists():
            try:
                with open(self.storage_file, 'r') as f:
                    self._cache = json.load(f)
            except Exception:
                pass

    async def _save(self):
        async with aiofiles.open(self.storage_file, 'w') as f:
            await f.write(json.dumps(self._cache, indent=2))

# Singleton instance
storage = LocalStorage()
