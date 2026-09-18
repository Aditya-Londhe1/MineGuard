from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

SECRET_KEY = "CHANGE_THIS_IN_PRODUCTION"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ---------------------------------------------------------
# Password hashing
# ---------------------------------------------------------

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:

    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    password_hash: str
) -> bool:

    return pwd_context.verify(
        plain_password,
        password_hash
    )


# ---------------------------------------------------------
# JWT
# ---------------------------------------------------------

def create_access_token(
    data: dict,
    expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES
):

    payload = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=expires_minutes
        )
    )

    payload.update({
        "exp": expire
    })

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )