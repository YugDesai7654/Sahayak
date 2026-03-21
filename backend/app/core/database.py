from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

_client: AsyncIOMotorClient = None


async def init_db():
    global _client
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = _client[settings.MONGODB_DB_NAME]

    from app.models.user import User
    from app.models.officer import Officer
    from app.models.admin import Admin
    from app.models.scheme import Scheme
    from app.models.application import Application
    from app.models.qr_token import QRToken
    from app.models.audit_log import AuditLog
    from app.models.notification import Notification

    await init_beanie(
        database=db,
        document_models=[
            User, Officer, Admin, Scheme, Application, QRToken, AuditLog, Notification
        ]
    )


async def close_db():
    global _client
    if _client:
        _client.close()


def get_db():
    if _client is None:
        raise RuntimeError("Database not initialized")
    return _client[settings.MONGODB_DB_NAME]
