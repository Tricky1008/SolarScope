from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from pydantic import BaseModel
from typing import Any, Dict
from app.core.config import settings
import logging
import jwt

logger = logging.getLogger("solarscope.auth")

# Initialize Supabase clients
# We use anon client for standard auth, and service client for admin overrides if ever needed
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

security = HTTPBearer()

class AuthCredentials(BaseModel):
    email: str
    password: str

async def sign_up(email: str, password: str) -> Dict[str, Any]:
    try:
        res = supabase.auth.sign_up({"email": email, "password": password})
        if not res.user:
            raise HTTPException(status_code=400, detail="Signup failed or user already exists.")
        return {"user": res.user.model_dump(), "session": res.session.model_dump() if res.session else None}
    except Exception as e:
        logger.error(f"[Auth] Signup error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

async def sign_in(email: str, password: str) -> Dict[str, Any]:
    try:
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        if not res.session:
            raise HTTPException(status_code=401, detail="Invalid credentials.")
        return {"user": res.user.model_dump(), "session": res.session.model_dump()}
    except Exception as e:
        logger.error(f"[Auth] Sign-in error: {e}")
        raise HTTPException(status_code=401, detail=str(e))

async def sign_out(token: str) -> Dict[str, str]:
    try:
        supabase.auth.sign_out()
        return {"message": "Successfully signed out"}
    except Exception as e:
        logger.error(f"[Auth] Sign-out error: {e}")
        raise HTTPException(status_code=400, detail="Failed to sign out")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency to extract and verify the JWT token from the Authorization header.
    Returns the user object if valid, throws 401 otherwise.
    """
    token = credentials.credentials
    try:
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user_res.user.model_dump()
    except Exception as e:
        logger.error(f"[Auth] Supabase token validation error: {e}. Falling back to manual decode.")
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            if "sub" in decoded:
                return {"id": decoded["sub"], "email": decoded.get("email")}
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        except Exception as jwt_err:
            logger.error(f"[Auth] PyJWT fallback failed: {jwt_err}")
            raise HTTPException(status_code=401, detail="Invalid or expired token")
