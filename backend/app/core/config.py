from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "sahayak"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT RS256 Keys
    JWT_PRIVATE_KEY_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "keys", "private.pem")
    JWT_PUBLIC_KEY_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "keys", "public.pem")
    JWT_ALGORITHM: str = "RS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # External Services
    MSG91_API_KEY: Optional[str] = None
    MSG91_SENDER_ID: Optional[str] = None
    FCM_SERVER_KEY: Optional[str] = None
    CLOUDINARY_URL: Optional[str] = None
    TESSERACT_CMD: Optional[str] = None

    # NLP Suggestions
    NLP_SUGGESTION_TOP_N: int = 10
    NLP_SIMILARITY_THRESHOLD: float = 0.05

    # App
    APP_NAME: str = "Sahayak"
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
