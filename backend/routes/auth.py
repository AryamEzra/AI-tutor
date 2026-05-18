from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

from auth import create_access_token, hash_password, require_auth, users_db, verify_password
from models import UserCreate, UserLogin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(user: UserCreate) -> dict:
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")

    users_db[user.email] = {
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name or user.email.split("@")[0],
        "created_at": datetime.utcnow().isoformat(),
    }
    token = create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "user": {"email": user.email, "name": users_db[user.email]["name"]},
    }


@router.post("/login")
async def login(user: UserLogin) -> dict:
    db_user = users_db.get(user.email)
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "user": {"email": db_user["email"], "name": db_user["name"]},
    }


@router.get("/me")
async def get_me(user: dict = Depends(require_auth)) -> dict:
    return {"email": user["email"], "name": user["name"], "created_at": user["created_at"]}