from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings

# app = FastAPI(
#     title=settings.app_name,
#     description="Backend API for the SplitNest expense-sharing application",
#     version=settings.app_version,
#     debug=settings.debug
# )



app = FastAPI(
    title="SplitNest API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
ALLOWED_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}


@app.middleware("http")
async def enforce_cors_origin(request, call_next):
    response = await call_next(request)

    origin = request.headers.get("origin")

    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"

    return response
app.include_router(api_router, prefix="/api/v1")

# app.include_router(
#     api_router,
#     prefix=settings.api_v1_prefix
# )


@app.get("/")
def root():
    return {
        "message": f"Welcome to the {settings.app_name}",
        "documentation": "/docs",
        "version": settings.app_version
    }
    
