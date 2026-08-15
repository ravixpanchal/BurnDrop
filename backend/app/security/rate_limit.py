"""Redis-based rate limiting."""

import time
from typing import Annotated

import redis.asyncio as redis
from fastapi import Depends, HTTPException, Request, status

from app.config.settings import get_settings

import logging

logger = logging.getLogger(__name__)

_redis_client = None

class InMemoryRedis:
    def __init__(self):
        pass

    def pipeline(self):
        return InMemoryPipeline()

    async def aclose(self):
        pass

class InMemoryPipeline:
    def __init__(self):
        pass

    def zremrangebyscore(self, key, min_score, max_score):
        return self

    def zadd(self, key, mapping):
        return self

    def zcard(self, key):
        return self

    def expire(self, key, seconds):
        return self

    async def execute(self):
        return [0, None, 1, True]

async def get_redis():
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        try:
            r = redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=1.0)
            await r.ping()
            _redis_client = r
        except Exception:
            logger.warning("Redis unavailable; using in-memory fallback for local development.")
            _redis_client = InMemoryRedis()
    return _redis_client


async def close_redis() -> None:
    global _redis_client
    if _redis_client is not None:
        try:
            await _redis_client.aclose()
        except Exception:
            pass
        _redis_client = None


class RateLimiter:
    def __init__(self, key_prefix: str, max_requests: int, window_seconds: int):
        self.key_prefix = key_prefix
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def check(self, redis_client: redis.Redis, identifier: str) -> None:
        key = f"ratelimit:{self.key_prefix}:{identifier}"
        now = time.time()
        window_start = now - self.window_seconds

        pipe = redis_client.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, self.window_seconds)
        results = await pipe.execute()
        count = results[2]

        if count > self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


upload_limiter = RateLimiter("upload", max_requests=100, window_seconds=3600)
verify_limiter = RateLimiter("verify", max_requests=10, window_seconds=60)
invalid_code_limiter = RateLimiter("invalid_code", max_requests=5, window_seconds=900)


async def check_invalid_code_attempt(redis_client: redis.Redis, ip: str) -> None:
    await invalid_code_limiter.check(redis_client, ip)
