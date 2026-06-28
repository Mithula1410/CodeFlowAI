import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database.base import Base
from app.database.session import get_db
from app.core.security import get_password_hash
from app.ai.factory import get_ai_provider

# Setup local testing engine
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db():
    # Setup test tables
    Base.metadata.create_all(bind=engine)
    db_session = TestingSessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_user_registration_and_login(client):
    # Test Registration
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "tester@codeflow.ai", "password": "password123", "full_name": "Test User"}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "tester@codeflow.ai"
    
    # Test Login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "tester@codeflow.ai", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "refresh_token" in response.json()

def test_mock_ai_provider_completion():
    provider = get_ai_provider("mock")
    import asyncio
    
    # Test code gen
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    res = loop.run_until_complete(provider.generate_code("write hello world", "python", "vanilla", 0.7))
    
    assert "code" in res
    assert "explanation" in res
    assert res["metrics"]["provider"] == "mock"
