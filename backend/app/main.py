from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.config.settings import settings
from backend.app.config.logging import logger
from backend.app.api.routes import health, search, flights, airports, routes, airlines, predictions, map as map_route, india

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="SKYHOUR: Production-Grade Python FastAPI Aviation Intelligence & XGBoost Delay Prediction Engine",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router)
app.include_router(search.router)
app.include_router(flights.router)
app.include_router(airports.router)
app.include_router(routes.router)
app.include_router(airlines.router)
app.include_router(predictions.router)
app.include_router(map_route.router)
app.include_router(india.router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "ERROR",
            "error": {
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": f"An unexpected internal error occurred: {str(exc)}"
            }
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=settings.debug)
