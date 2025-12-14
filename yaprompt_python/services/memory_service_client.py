"""
Memory Service Client (Python Helper)
Wraps ContinuumMemorySystem for compatibility
"""
# This file is actually just a re-export or thin wrapper around continuum_memory_system
# But since TS PromptOptimizer imported MemoryService, we need a python equivalent if porting strictly.
# However, in Python we can just import continuum_memory_system directly. 
# I am creating this file just to satisfy the import in prompt_auto_optimizer.py above.

from .continuum_memory_system import continuum_memory_system as memory_service
