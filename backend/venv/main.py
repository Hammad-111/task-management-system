from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import engine, get_db
from models import Base, User, Task
from schemas import UserCreate, Token, TaskCreate, TaskUpdate, TaskResponse, TaskListResponse
from auth import hash_password, verify_password, create_access_token, get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI()

STATUSES = ["Todo", "In Progress", "Done"]


def check_status(status):
    if status not in STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")


def get_task_for_user(db, task_id, user_id):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


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


@app.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_status(task.status)

    new_task = Task(
        title=task.title,
        description=task.description or "",
        status=task.status,
        due_date=task.due_date,
        user_id=user.id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@app.get("/tasks", response_model=TaskListResponse)
def get_tasks(
    page: int = 1,
    page_size: int = 10,
    search: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    q = db.query(Task).filter(Task.user_id == user.id)

    if search:
        q = q.filter(Task.title.ilike(f"%{search}%"))
    if status:
        check_status(status)
        q = q.filter(Task.status == status)

    total = q.count()
    skip = (page - 1) * page_size
    tasks = q.order_by(Task.created_at.desc()).offset(skip).limit(page_size).all()

    return {"tasks": tasks, "total": total, "page": page, "page_size": page_size}


@app.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_task_for_user(db, task_id, user.id)


@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = get_task_for_user(db, task_id, user.id)

    if data.title:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.status:
        check_status(data.status)
        task.status = data.status
    if data.due_date is not None:
        task.due_date = data.due_date

    db.commit()
    db.refresh(task)
    return task


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = get_task_for_user(db, task_id, user.id)
    db.delete(task)
    db.commit()
    return {"message": "deleted"}
