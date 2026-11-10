from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError

from app.core.config import settings
from app.db.database import get_database, to_object_id

router = APIRouter()

ALGORITHM = "HS256"
security = HTTPBearer(auto_error=False)


class UserRegister(BaseModel):
    email: EmailStr
    # bcrypt only uses the first 72 bytes
    password: str = Field(..., min_length=6, max_length=72)
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    name: Optional[str] = None
    created_at: str


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    created_at: str


def _create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.JWT_SECRET, algorithm=ALGORITHM)


def _token_response(user: Dict[str, Any]) -> TokenResponse:
    user_id = str(user["_id"])
    return TokenResponse(
        access_token=_create_access_token(user_id),
        user_id=user_id,
        email=user["email"],
        name=user.get("name"),
        created_at=user["created_at"].isoformat(),
    )


async def _get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        return None
    oid = to_object_id(payload.get("sub"))
    if oid is None:
        return None
    return await get_database().users.find_one({"_id": oid})


async def require_auth(user=Depends(_get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED,
             summary="Register a new user account")
async def register(user_in: UserRegister):
    user = {
        "email": user_in.email.lower(),
        "password_hash": bcrypt.hashpw(user_in.password.encode(), bcrypt.gensalt()).decode(),
        "name": user_in.name,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        result = await get_database().users.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already registered")
    user["_id"] = result.inserted_id
    return _token_response(user)


@router.post("/auth/login", response_model=TokenResponse, summary="Login and receive an access token")
async def login(login_in: UserLogin):
    user = await get_database().users.find_one({"email": login_in.email.lower()})
    if not user or not bcrypt.checkpw(login_in.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _token_response(user)


@router.post("/auth/logout", summary="Logout (client-side token discard)")
async def logout():
    # JWT is stateless; the client deletes its token.
    return {"message": "Logged out"}


@router.get("/auth/me", response_model=UserOut, summary="Get the current authenticated user")
async def get_current_user(user=Depends(require_auth)):
    return UserOut(
        id=str(user["_id"]),
        email=user["email"],
        name=user.get("name"),
        created_at=user["created_at"].isoformat(),
    )
