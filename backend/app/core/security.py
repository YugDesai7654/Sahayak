import os
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Optional

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

_private_key: Optional[str] = None
_public_key: Optional[str] = None


def _ensure_keys_dir():
    keys_dir = os.path.dirname(settings.JWT_PRIVATE_KEY_PATH)
    os.makedirs(keys_dir, exist_ok=True)


def generate_rsa_keys():
    """Generate RS256 key pair and save to files."""
    _ensure_keys_dir()
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    public_pem = key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    with open(settings.JWT_PRIVATE_KEY_PATH, "wb") as f:
        f.write(private_pem)
    with open(settings.JWT_PUBLIC_KEY_PATH, "wb") as f:
        f.write(public_pem)
    return private_pem.decode(), public_pem.decode()


def load_keys():
    """Load RS256 key pair from files or generate if not exist."""
    global _private_key, _public_key
    if not os.path.exists(settings.JWT_PRIVATE_KEY_PATH):
        _private_key, _public_key = generate_rsa_keys()
    else:
        with open(settings.JWT_PRIVATE_KEY_PATH, "r") as f:
            _private_key = f.read()
        with open(settings.JWT_PUBLIC_KEY_PATH, "r") as f:
            _public_key = f.read()
    return _private_key, _public_key


def get_private_key() -> str:
    global _private_key
    if _private_key is None:
        load_keys()
    return _private_key


def get_public_key() -> str:
    global _public_key
    if _public_key is None:
        load_keys()
    return _public_key


# ── Password Hashing ──────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT Token Creation ─────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "access"})
    return jwt.encode(to_encode, get_private_key(), algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "refresh"})
    return jwt.encode(to_encode, get_private_key(), algorithm=settings.JWT_ALGORITHM)


def create_qr_token(data: dict) -> str:
    """Sign a QR payload with 100-year expiry using the same RS256 key pair."""
    to_encode = data.copy()
    to_encode.update({
        "exp": datetime.now(timezone.utc) + timedelta(days=36500),
        "iat": datetime.now(timezone.utc),
        "type": "qr"
    })
    return jwt.encode(to_encode, get_private_key(), algorithm=settings.JWT_ALGORITHM)


def create_email_verification_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire, "type": "email_verify"})
    return jwt.encode(to_encode, get_private_key(), algorithm=settings.JWT_ALGORITHM)


def create_password_reset_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    to_encode.update({"exp": expire, "type": "password_reset"})
    return jwt.encode(to_encode, get_private_key(), algorithm=settings.JWT_ALGORITHM)


# ── JWT Token Verification ────────────────────────────────────

def decode_token(token: str) -> dict:
    """Decode and verify a JWT token using the public key."""
    try:
        payload = jwt.decode(token, get_public_key(), algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {str(e)}")


# ── Utility ────────────────────────────────────────────────────

def generate_random_password(length: int = 16) -> str:
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


def generate_sahayak_id(state_code: str, sequence: int) -> str:
    year = datetime.now().year
    return f"SAH-{year}-{state_code[:2].upper()}-{sequence:05d}"


def generate_officer_id(district_code: str, sequence: int) -> str:
    return f"OFF-{district_code[:3].upper()}-{sequence:03d}"


def generate_admin_id(tier: str, jurisdiction_code: str, sequence: int) -> str:
    prefix_map = {"national": "NAT", "state": "ST", "district": "DIS", "taluka": "TAL"}
    prefix = prefix_map.get(tier, "ADM")
    code = jurisdiction_code[:3].upper() if jurisdiction_code else "ALL"
    return f"ADM-{prefix}-{code}-{sequence:03d}"


def generate_application_id(sequence: int) -> str:
    year = datetime.now().year
    return f"APP-{year}-{sequence:05d}"


def generate_scheme_id(name: str, sequence: int) -> str:
    slug = name[:10].upper().replace(" ", "-")
    return f"{slug}-{sequence:03d}"
