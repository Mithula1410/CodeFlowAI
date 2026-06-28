import logging
from sqlalchemy.orm import Session
from app.database.session import engine
from app.database.base import Base
from app.models.user import User
from app.core.security import get_password_hash

logger = logging.getLogger("app")

def init_db(db: Session) -> None:
    # Auto-create tables (useful for sqlite & quick local runs)
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
    
    # Create a default admin user if one doesn't exist
    admin_email = "admin@codeflow.ai"
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if not existing_admin:
        admin_user = User(
            email=admin_email,
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            role="ADMIN",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        logger.info(f"Default admin user created: {admin_email} / admin123")
    else:
        logger.info("Admin user already exists.")
