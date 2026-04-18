from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from core.database import check_db_health
from core.storage import get_storage
from routers import admin, auth, doctors, lab, opd, records, users

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    storage = get_storage()
    await storage.ensure_bucket()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    await check_db_health()
    return {"status": "ok"}


app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(users.router, prefix=settings.api_prefix)
app.include_router(doctors.router, prefix=settings.api_prefix)
app.include_router(opd.router, prefix=settings.api_prefix)
app.include_router(lab.router, prefix=settings.api_prefix)
app.include_router(records.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)
