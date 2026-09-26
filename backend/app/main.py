import asyncio
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.config.settings import get_settings
from app.database import async_session_factory, engine
from app.models import Base
from app.security.rate_limit import close_redis
from app.storage import get_storage_service
from app.workers.cleanup import cleanup_loop

logger = logging.getLogger(__name__)


async def init_database() -> None:
    """Initialize database tables with automatic SQLite fallback if primary DB is unreachable."""
    from app.database import engine, set_engine_and_factory

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as exc:
        logger.warning("Primary database connection failed (%s); falling back to local SQLite database.", exc)
        from sqlalchemy.ext.asyncio import create_async_engine

        fallback_engine = create_async_engine("sqlite+aiosqlite:///burndrop_dev.db", echo=False)
        set_engine_and_factory(fallback_engine)
        async with fallback_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)



@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    await init_database()

    storage = get_storage_service()
    cleanup_task = asyncio.create_task(cleanup_loop(async_session_factory, storage))
    logger.info("%s backend started", settings.app_name)

    yield

    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    await close_redis()
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="Passwordless one-time temporary file sharing",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        if settings.app_base_url.startswith("https"):
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error [request_id=%s]", getattr(request.state, "request_id", "unknown"))
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected error occurred. Please try again later."},
        )

    app.include_router(router, prefix="/api")

    return app


app = create_app()
