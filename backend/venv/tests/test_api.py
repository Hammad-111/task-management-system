import os
import sys

# taake hum upar wali files (main, database) import kar saken
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db

# test ke liye alag database, asli tasks.db ko haath nahi lagate
engine = create_engine(
    "sqlite:///./test.db",
    connect_args={"check_same_thread": False},
)
TestingSession = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def get_token():
    # har baar naya user banate hain taake clash na ho
    import random
    name = "user" + str(random.randint(1000, 999999))
    client.post("/register", json={
        "username": name,
        "email": name + "@test.com",
        "password": "secret123",
    })
    res = client.post("/login", data={"username": name, "password": "secret123"})
    return res.json()["access_token"]


def test_register():
    res = client.post("/register", json={
        "username": "hammadtest",
        "email": "hammadtest@test.com",
        "password": "secret123",
    })
    assert res.status_code == 200

    # short password reject hona chahiye
    res2 = client.post("/register", json={
        "username": "abc",
        "email": "abc@test.com",
        "password": "123",
    })
    assert res2.status_code == 400


def test_login_wrong_password():
    client.post("/register", json={
        "username": "loginuser",
        "email": "loginuser@test.com",
        "password": "secret123",
    })
    res = client.post("/login", data={"username": "loginuser", "password": "wrong"})
    assert res.status_code == 401


def test_tasks_need_token():
    res = client.get("/tasks")
    assert res.status_code == 401


def test_create_and_get_task():
    token = get_token()
    headers = {"Authorization": "Bearer " + token}

    res = client.post("/tasks", json={"title": "my task", "status": "Todo"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["title"] == "my task"

    res2 = client.get("/tasks", headers=headers)
    assert res2.status_code == 200
    assert res2.json()["total"] == 1


def test_update_and_delete_task():
    token = get_token()
    headers = {"Authorization": "Bearer " + token}

    task = client.post("/tasks", json={"title": "old", "status": "Todo"}, headers=headers).json()
    tid = task["id"]

    res = client.put("/tasks/" + str(tid), json={"status": "Done"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "Done"

    res2 = client.delete("/tasks/" + str(tid), headers=headers)
    assert res2.status_code == 200


def test_invalid_status():
    token = get_token()
    headers = {"Authorization": "Bearer " + token}
    res = client.post("/tasks", json={"title": "x", "status": "Random"}, headers=headers)
    assert res.status_code == 400
