from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.security import load_keys
from app.api.routes import auth, citizens, schemes, applications, officer, admin, notifications, suggestions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    load_keys()
    await init_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Sahayak API",
    description="Government Scheme Auto-Matcher, Auto-Filer, and Civic Identity Wallet",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(citizens.router, prefix="/api/citizens", tags=["Citizens"])
app.include_router(schemes.router, prefix="/api/schemes", tags=["Schemes"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(officer.router, prefix="/api/officer", tags=["Officer"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(suggestions.router, prefix="/api/suggestions", tags=["Suggestions"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": "Sahayak API"}


@app.get("/api/public-key")
async def get_public_key():
    """Return the RS256 public key for QR verification."""
    from app.core.security import get_public_key
    return {"public_key": get_public_key()}
