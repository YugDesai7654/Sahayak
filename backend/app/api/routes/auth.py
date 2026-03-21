from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel, EmailStr
from app.services.auth_service import (
    register_citizen, verify_email, login_citizen, login_officer,
    login_admin, refresh_access_token, forgot_password, reset_password
)

router = APIRouter()


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str
    phone: str
    state: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    token: str


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        "access_token", access_token,
        httponly=True, samesite="lax", max_age=900, path="/"
    )
    response.set_cookie(
        "refresh_token", refresh_token,
        httponly=True, samesite="lax", max_age=604800, path="/"
    )


@router.post("/register")
async def register(req: RegisterRequest, response: Response):
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    try:
        result = await register_citizen(req.email, req.password, req.name, req.phone, req.state)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-email")
async def verify_email_route(req: VerifyEmailRequest):
    success = await verify_email(req.token)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    return {"message": "Email verified successfully"}


@router.post("/login")
async def login(req: LoginRequest, response: Response):
    try:
        result = await login_citizen(req.email, req.password)
        _set_auth_cookies(response, result["access_token"], result["refresh_token"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/officer/login")
async def officer_login(req: LoginRequest, response: Response):
    try:
        result = await login_officer(req.email, req.password)
        _set_auth_cookies(response, result["access_token"], result["refresh_token"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/admin/login")
async def admin_login(req: LoginRequest, response: Response):
    try:
        result = await login_admin(req.email, req.password)
        _set_auth_cookies(response, result["access_token"], result["refresh_token"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        result = await refresh_access_token(refresh_token)
        response.set_cookie(
            "access_token", result["access_token"],
            httponly=True, samesite="lax", max_age=900, path="/"
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/forgot-password")
async def forgot_password_route(req: ForgotPasswordRequest):
    result = await forgot_password(req.email)
    return result


@router.post("/reset-password")
async def reset_password_route(req: ResetPasswordRequest):
    try:
        await reset_password(req.token, req.new_password)
        return {"message": "Password reset successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}
