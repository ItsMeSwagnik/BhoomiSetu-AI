from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os
from app.config import settings
from app.database import create_tables
from app.routers import auth, documents, records, verification, approval, parcels, audit, dashboard, admin, submissions, notifications

app = FastAPI(title="BhoomiSetu AI API", version="1.0.0", docs_url="/api/docs", redoc_url="/api/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(documents.router, prefix=PREFIX)
app.include_router(records.router, prefix=PREFIX)
app.include_router(verification.router, prefix=PREFIX)
app.include_router(approval.router, prefix=PREFIX)
app.include_router(parcels.router, prefix=PREFIX)
app.include_router(audit.router, prefix=PREFIX)
app.include_router(dashboard.router, prefix=PREFIX)
app.include_router(admin.router, prefix=PREFIX)
app.include_router(submissions.router, prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)

# Serve uploaded files
storage_path = os.path.abspath(settings.storage_local_path)
if os.path.exists(storage_path):
    app.mount("/api/v1/files", StaticFiles(directory=storage_path), name="files")


@app.on_event("startup")
async def startup():
    create_tables()
    os.makedirs(settings.storage_local_path, exist_ok=True)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
