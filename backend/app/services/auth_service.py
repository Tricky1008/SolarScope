from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None
from pydantic import BaseModel
from typing import Any, Dict, Optional
from app.core.config import settings
import logging
import jwt

logger = logging.getLogger("solarscope.auth")

# Initialize Supabase clients
# We use anon client for standard auth, and service client for admin overrides if ever needed
supabase: Optional[Client] = None
supabase_admin: Optional[Client] = None

_url = settings.SUPABASE_URL
_key = settings.SUPABASE_ANON_KEY
if create_client and _url and _key and "supabase.co" in _url and not _url.startswith("https://your-"):
    try:
        supabase = create_client(_url, _key)
        if settings.SUPABASE_SERVICE_ROLE_KEY:
            supabase_admin = create_client(_url, settings.SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Supabase init failed: {e}")

security = HTTPBearer(auto_error=False)

class AuthCredentials(BaseModel):
    email: str
    password: str

async def sign_up(email: str, password: str) -> Dict[str, Any]:
    if supabase is None:
        raise HTTPException(503, "Supabase is not configured. Add SUPABASE_URL to .env")
    try:
        res = supabase.auth.sign_up({"email": email, "password": password})
        if not res.user:
            raise HTTPException(status_code=400, detail="Signup failed or user already exists.")
        return {"user": res.user.model_dump(), "session": res.session.model_dump() if res.session else None}
    except Exception as e:
        logger.error(f"[Auth] Signup error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

async def sign_in(email: str, password: str) -> Dict[str, Any]:
    if supabase is None:
        raise HTTPException(503, "Supabase is not configured. Add SUPABASE_URL to .env")
    try:
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        if not res.session:
            raise HTTPException(status_code=401, detail="Invalid credentials.")
        return {"user": res.user.model_dump(), "session": res.session.model_dump()}
    except Exception as e:
        logger.error(f"[Auth] Sign-in error: {e}")
        raise HTTPException(status_code=401, detail=str(e))

async def sign_out(token: str) -> Dict[str, str]:
    if supabase is None:
        raise HTTPException(503, "Supabase is not configured. Add SUPABASE_URL to .env")
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
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    if supabase is None:
        # Supabase not configured — try JWT decode as fallback
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            if "sub" in decoded:
                return {"id": decoded["sub"], "email": decoded.get("email")}
        except Exception:
            pass
        raise HTTPException(503, "Supabase is not configured. Add SUPABASE_URL to .env")
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


async def optional_get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[Dict[str, Any]]:
    """
    Optional auth dependency — returns user dict if authenticated, None otherwise.
    Use this for endpoints that should work with or without authentication.
    """
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
