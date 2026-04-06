#!/usr/bin/env python3
"""
Cache helper for MYCHAT APP - Reduces API calls and improves response time
Implements simple in-memory caching with TTL (Time To Live)
"""

import time
import hashlib
from typing import Optional, Dict, Any
import json

class ResponseCache:
    """Simple cache for AI responses with TTL support."""
    
    def __init__(self, ttl_seconds: int = 3600):
        """
        Initialize cache with TTL (default 1 hour).
        
        Args:
            ttl_seconds: Time to live for cached items in seconds
        """
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_seconds
        self.hits = 0
        self.misses = 0
    
    def _hash_query(self, query: str) -> str:
        """Create a consistent hash for a query."""
        return hashlib.md5(query.lower().strip().encode()).hexdigest()
    
    def get(self, query: str) -> Optional[str]:
        """
        Get cached response for a query.
        
        Args:
            query: The user's query
            
        Returns:
            Cached response if found and not expired, None otherwise
        """
        key = self._hash_query(query)
        
        if key not in self.cache:
            self.misses += 1
            return None
        
        entry = self.cache[key]
        
        # Check if cache entry has expired
        if time.time() - entry['timestamp'] > self.ttl:
            del self.cache[key]
            self.misses += 1
            return None
        
        self.hits += 1
        return entry['response']
    
    def set(self, query: str, response: str) -> None:
        """
        Cache a response for a query.
        
        Args:
            query: The user's query
            response: The AI response to cache
        """
        if not response or not query:
            return
        
        key = self._hash_query(query)
        self.cache[key] = {
            'response': response,
            'timestamp': time.time(),
            'query': query
        }
    
    def clear(self) -> None:
        """Clear all cached responses."""
        self.cache.clear()
        self.hits = 0
        self.misses = 0
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        return {
            'cached_items': len(self.cache),
            'total_hits': self.hits,
            'total_misses': self.misses,
            'hit_rate': f"{hit_rate:.1f}%",
            'ttl_seconds': self.ttl
        }
    
    def cleanup_expired(self) -> int:
        """Remove expired entries from cache."""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self.cache.items()
            if current_time - entry['timestamp'] > self.ttl
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        return len(expired_keys)


# Global cache instance
response_cache = ResponseCache(ttl_seconds=3600)  # 1 hour TTL
