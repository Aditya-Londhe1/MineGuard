from datetime import datetime

from backend.database import SessionLocal
from backend.models.database_models import User
from backend.auth.security import hash_password


def main():
    db = SessionLocal()

    try:
        username = "supervisor"
        password = "ChangeMe123!"

        existing = (
            db.query(User)
            .filter(User.username == username)
            .first()
        )

        if existing:
            print(
                "User already exists:",
                username
            )
            return

        user = User(
            username=username,
            password_hash=hash_password(password),
            role="SUPERVISOR",
            is_active=True,
            created_at=datetime.utcnow()
        )

        db.add(user)
        db.commit()

        print(
            "Created development user:",
            username
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
