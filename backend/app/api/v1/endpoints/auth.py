from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
import uuid

router = APIRouter()

# --- Auth config (Phase 18 — replace with env vars in production) ---
SECRET_KEY = "agenttrace-dev-secret-change-me"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

# --- In-memory user store (Phase 18 — replaced by DB in Phase 19 cloud sync) ---
_users: Dict[str, Dict[str, Any]] = {}
_emails: Dict[str, str] = {}  # email -> user_id


# --- Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
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


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    created_at: str


# --- Helpers ---
def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user_id, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return _users.get(user_id)
    except JWTError:
        return None


# --- Endpoints ---
@router.post(
    "/auth/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(user_in: UserRegister):
    if user_in.email in _emails:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    _users[user_id] = {
        "id": user_id,
        "email": user_in.email,
        "password_hash": _hash_password(user_in.password),
        "name": user_in.name,
        "created_at": now,
    }
    _emails[user_in.email] = user_id
    token = _create_access_token(user_id)
    return TokenResponse(
        access_token=token,
        user_id=user_id,
        email=user_in.email,
        name=user_in.name,
    )


@router.post(
    "/auth/login",
    response_model=TokenResponse,
    summary="Login and receive an access token",
)
async def login(login_in: UserLogin):
    user_id = _emails.get(login_in.email)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user = _users[user_id]
    if not _verify_password(login_in.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = _create_access_token(user_id)
    return TokenResponse(
        access_token=token,
        user_id=user_id,
        email=user["email"],
        name=user.get("name"),
    )


@router.post(
    "/auth/logout",
    summary="Logout (client-side token discard)",
)
async def logout():
    # JWT is stateless; logout is handled client-side by deleting the token.
    return {"message": "Logged out"}


@router.get(
    "/auth/me",
    response_model=UserOut,
    summary="Get the current authenticated user",
)
async def get_current_user(user = Depends(_get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserOut(
        id=user["id"],
        email=user["email"],
        name=user.get("name"),
        created_at=user["created_at"],
    )


# --- Dependency for protected routes ---
def require_auth(user = Depends(_get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user
