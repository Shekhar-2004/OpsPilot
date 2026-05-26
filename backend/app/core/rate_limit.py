import time
from typing import Dict, List
from fastapi import HTTPException, status

class InMemoryRateLimiter:
    def __init__(self):
        # Maps key -> list of request timestamps
        self.requests: Dict[str, List[float]] = {}
        
    def check_rate_limit(self, key: str, max_requests: int, window_seconds: int):
        current_time = time.time()
        
        # 1. Slide the window: remove timestamps older than window_seconds
        if key in self.requests:
            self.requests[key] = [t for t in self.requests[key] if current_time - t < window_seconds]
            
            # Prune memory: if no active requests remain, garbage-collect the key entirely
            if not self.requests[key]:
                self.requests.pop(key, None)
                
        # 2. Check threshold limit
        if key in self.requests and len(self.requests[key]) >= max_requests:
            # Calculate wait time in seconds until the oldest slot is released
            oldest_request_time = self.requests[key][0]
            wait_time = window_seconds - (current_time - oldest_request_time)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please try again in {int(max(1, wait_time))} seconds."
            )
            
        # 3. Add current request timestamp
        if key not in self.requests:
            self.requests[key] = []
        self.requests[key].append(current_time)

# Shared global rate limiters for query throttling
ai_minute_limiter = InMemoryRateLimiter()
ai_day_limiter = InMemoryRateLimiter()
