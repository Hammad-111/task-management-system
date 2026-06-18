from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import engine, get_db
from models import Base, User
from schemas import UserCreate, Token
from auth import hash_password, verify_password, create_access_token

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if len(user.username) < 3:
        raise HTTPException(status_code=400, detail="Username too short")
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    exists = db.query(User).filter(
        or_(User.username == user.username, User.email == user.email)
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Username or email already taken")

    new_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()

    return {"message": "User created successfully"}


@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    username = form_data.username.strip()
    user = db.query(User).filter(
        or_(User.username == username, User.email == username)
    ).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Wrong username or password")

    token = create_access_token(user.username)
    return {"access_token": token, "token_type": "bearer"}
