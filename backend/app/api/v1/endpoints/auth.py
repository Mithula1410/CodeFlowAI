import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_active_user
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User, UserSession, RefreshToken
from app.models.analytics import AuditLog
from app.schemas.user import UserCreate, UserResponse, TokenResponse, TokenRefreshRequest
from app.core.logging_config import logger

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email address already exists in the system."
        )
    
    # Hash password & Save
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role="USER",
        is_active=True
    )
    db.add(user)
    db.flush()  # Obtain user.id
    
    # Audit log
    db.add(AuditLog(
        user_id=user.id,
        action="register",
        details=f"User registered with email: {user.email}"
    ))
    db.commit()
    logger.info(f"User registered successfully: {user.email}")
    return user

@router.post("/login", response_model=TokenResponse)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Authenticate user
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token_str = create_refresh_token(user.id)
    
    # Save Refresh Token
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    db_refresh = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=expires_at
    )
    db.add(db_refresh)
    
    # Track User Session
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    session = UserSession(
        user_id=user.id,
        ip_address=client_ip,
        user_agent=user_agent
    )
    db.add(session)
    
    # Audit Log
    db.add(AuditLog(
        user_id=user.id,
        action="login",
        ip_address=client_ip,
        details=f"Successful login from agent {user_agent[:100]}"
    ))
    
    db.commit()
    logger.info(f"User logged in: {user.email}")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    refresh_in: TokenRefreshRequest,
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh credentials",
    )
    
    payload = decode_token(refresh_in.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise credentials_exception
        
    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception
        
    # Verify in DB
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_in.refresh_token,
        RefreshToken.user_id == user_id
    ).first()
    
    if not db_token or db_token.expires_at < datetime.datetime.utcnow():
        if db_token:
            db.delete(db_token)
            db.commit()
        raise credentials_exception
        
    # Delete old refresh token, generate new pairs
    db.delete(db_token)
    
    new_access_token = create_access_token(user_id)
    new_refresh_token_str = create_refresh_token(user_id)
    
    new_expires = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    new_db_refresh = RefreshToken(
        user_id=user_id,
        token=new_refresh_token_str,
        expires_at=new_expires
    )
    db.add(new_db_refresh)
    db.commit()
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token_str,
        "token_type": "bearer"
    }
