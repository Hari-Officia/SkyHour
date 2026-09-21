from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

T = TypeVar("T")

class MetaData(BaseModel):
    source: str = "Skyhour Unified Intelligence Engine"
    data_mode: str = "REAL DATA"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"))
    version: str = "2.0.0"

class APIResponse(BaseModel, Generic[T]):
    status: str = "SUCCESS"
    query: Optional[str] = None
    data_mode: str = "REAL DATA"
    is_demo: bool = False
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"))
    data: Optional[T] = None

class ErrorDetail(BaseModel):
    error_code: str
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"))

class APIErrorResponse(BaseModel):
    status: str = "ERROR"
    error: ErrorDetail
