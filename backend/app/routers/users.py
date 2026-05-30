from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import auth, schemas
from ..database import get_db
from ..models import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)) -> User:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=payload.email,
        password_hash=auth.hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        hpcz_number=payload.hpcz_number,
        facility_name=payload.facility_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)) -> schemas.Token:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = auth.create_access_token(user.id)
    return schemas.Token(access_token=token)


@router.get("/me", response_model=schemas.UserResponse)
def me(current_user: User = Depends(auth.get_current_user)) -> User:
    return current_user
