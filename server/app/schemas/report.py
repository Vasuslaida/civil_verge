from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReportCreate(BaseModel):
    title: str
    description: str
    category: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ReportUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    department_id: Optional[int] = None

class ReportHistoryResponse(BaseModel):
    id: int
    report_id: int
    status: str
    changed_at: datetime
    changed_by_id: Optional[int] = None

    class Config:
        from_attributes = True

class ReportResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    priority: str
    photo_url: Optional[str] = None
    department_id: Optional[int] = None
    ai_summary: Optional[str] = None
    citizen_id: int
    created_at: datetime
    history: Optional[list[ReportHistoryResponse]] = []

    class Config:
        from_attributes = True