import uvicorn
from backend.app.config.settings import settings

if __name__ == "__main__":
    print(f"============================================================")
    print(f"   SKYHOUR PYTHON FASTAPI BACKEND SERVER (v{settings.app_version})")
    print(f"============================================================")
    print(f"Listening on: http://{settings.host}:{settings.port}")
    print(f"Swagger Docs: http://{settings.host}:{settings.port}/docs")
    print(f"============================================================")
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, log_level="info")
