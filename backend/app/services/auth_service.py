import re
from datetime import datetime, timezone
from typing import Optional
from app.models.user import User, UserAuth, UserProfile
from app.models.officer import Officer
from app.models.admin import Admin
from app.core.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    create_email_verification_token, create_password_reset_token,
    decode_token, generate_sahayak_id
)


PASSWORD_REGEX = re.compile(r'^(?=.*[A-Z])(?=.*\d).{8,}$')


async def get_next_sahayak_sequence() -> int:
    count = await User.count()
    return count + 1


async def register_citizen(email: str, password: str, name: str, phone: str, state: str) -> dict:
    """Register a new citizen user."""
    # Check if email exists
    existing = await User.find_one({"auth.email": email})
    if existing:
        raise ValueError("Email already registered")

    if not PASSWORD_REGEX.match(password):
        raise ValueError("Password must be min 8 chars with 1 uppercase and 1 number")

    # Generate sahayak ID
    seq = await get_next_sahayak_sequence()
    state_code = state[:2].upper() if state else "XX"
    sahayak_id = generate_sahayak_id(state_code, seq)

    # Create verification token
    verify_token = create_email_verification_token({"sub": email})

    user = User(
        sahayak_id=sahayak_id,
        auth=UserAuth(
            email=email,
            password_hash=hash_password(password),
            is_verified=True,  # Auto-verify for dev; toggle in production
            verification_token=verify_token
        ),
        profile=UserProfile(name=name, phone=phone, state=state)
    )
    await user.insert()

    return {
        "sahayak_id": sahayak_id,
        "email": email,
        "verification_token": verify_token,
        "message": "Registration successful"
    }


async def verify_email(token: str) -> bool:
    """Verify a user's email with the verification token."""
    try:
        payload = decode_token(token)
        if payload.get("type") != "email_verify":
            return False
        email = payload.get("sub")
        user = await User.find_one({"auth.email": email})
        if not user:
            return False
        user.auth.is_verified = True
        user.auth.verification_token = None
        await user.save()
        return True
    except ValueError:
        return False


async def login_citizen(email: str, password: str) -> dict:
    """Authenticate citizen and return tokens."""
    user = await User.find_one({"auth.email": email})
    if not user:
        raise ValueError("Invalid credentials")
    if not verify_password(password, user.auth.password_hash):
        raise ValueError("Invalid credentials")
    if not user.auth.is_verified:
        raise ValueError("Email not verified. Please verify your email first.")

    token_data = {
        "sub": user.sahayak_id,
        "role": "citizen",
        "email": email
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "sahayak_id": user.sahayak_id,
            "name": user.profile.name,
            "email": email,
            "role": "citizen"
        }
    }


async def login_officer(email: str, password: str) -> dict:
    """Authenticate officer and return tokens."""
    officer = await Officer.find_one({"auth.email": email})
    if not officer:
        raise ValueError("Invalid credentials")
    if not verify_password(password, officer.auth.password_hash):
        raise ValueError("Invalid credentials")
    if not officer.auth.is_active:
        raise ValueError("Account is inactive")

    token_data = {
        "sub": officer.officer_id,
        "role": "officer",
        "email": email,
        "district": officer.district,
        "state": officer.state
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "officer_id": officer.officer_id,
            "name": officer.name,
            "email": email,
            "role": "officer",
            "office_name": officer.office_name,
            "district": officer.district,
            "department": officer.department
        }
    }


async def login_admin(email: str, password: str) -> dict:
    """Authenticate admin and return tokens."""
    admin = await Admin.find_one({"auth.email": email})
    if not admin:
        raise ValueError("Invalid credentials")
    if not verify_password(password, admin.auth.password_hash):
        raise ValueError("Invalid credentials")
    if not admin.auth.is_active:
        raise ValueError("Account is inactive")

    # Update last login
    admin.last_login_at = datetime.now(timezone.utc)
    await admin.save()

    token_data = {
        "sub": admin.admin_id,
        "role": "admin",
        "email": email,
        "tier": admin.tier,
        "jurisdiction": {
            "state": admin.jurisdiction.state,
            "district": admin.jurisdiction.district,
            "taluka": admin.jurisdiction.taluka
        }
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "admin_id": admin.admin_id,
            "name": admin.name,
            "email": email,
            "role": "admin",
            "tier": admin.tier,
            "jurisdiction": token_data["jurisdiction"],
            "must_change_password": admin.must_change_password
        }
    }


async def refresh_access_token(refresh_token_str: str) -> dict:
    """Generate a new access token from a valid refresh token."""
    try:
        payload = decode_token(refresh_token_str)
    except ValueError:
        raise ValueError("Invalid refresh token")

    if payload.get("type") != "refresh":
        raise ValueError("Invalid token type")

    token_data = {k: v for k, v in payload.items() if k not in ("exp", "iat", "type")}
    new_access = create_access_token(token_data)
    return {"access_token": new_access}


async def forgot_password(email: str) -> dict:
    """Generate a password reset token."""
    user = await User.find_one({"auth.email": email})
    if not user:
        # Always return success to prevent email enumeration
        return {"message": "If account exists, a reset link has been sent"}

    reset_token = create_password_reset_token({"sub": email, "role": "citizen"})
    # In production: send email with reset link containing token
    return {"message": "If account exists, a reset link has been sent", "reset_token": reset_token}


async def reset_password(token: str, new_password: str) -> bool:
    """Reset password using a valid reset token."""
    try:
        payload = decode_token(token)
    except ValueError:
        raise ValueError("Invalid or expired reset token")

    if payload.get("type") != "password_reset":
        raise ValueError("Invalid token type")

    if not PASSWORD_REGEX.match(new_password):
        raise ValueError("Password must be min 8 chars with 1 uppercase and 1 number")

    email = payload.get("sub")
    user = await User.find_one({"auth.email": email})
    if not user:
        raise ValueError("User not found")

    user.auth.password_hash = hash_password(new_password)
    await user.save()
    return True
