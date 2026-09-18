from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import cast

from backend.database import get_db
from backend.models.database_models import User

from backend.auth.schemas import (
    LoginRequest,
    TokenResponse,
    UserResponse
)

from backend.auth.security import (
    verify_password,
    create_access_token
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.username == request.username
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not cast(bool, user.is_active):

        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    if not verify_password(
        request.password,
        cast(str, user.password_hash)
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    token = create_access_token({
        "sub": str(user.id),
        "username": user.username,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }