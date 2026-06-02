import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.report import Report
from app.models.department import Department
from app.models.report_history import ReportHistory
from app.schemas.report import ReportResponse
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.ai import triage_report

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=ReportResponse)
async def create_report(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    photo_url = None
    if photo:
        file_location = os.path.join(UPLOAD_DIR, photo.filename)
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(photo.file, file_object)
        photo_url = f"/uploads/{photo.filename}"

    # AI Triage
    ai_result = triage_report(title, description, category)
    ai_summary = ai_result.get("ai_summary", "AI summarization failed.")
    priority = ai_result.get("priority", "medium")
    department_name = ai_result.get("department_name")

    department_id = None
    if department_name:
        dept = db.query(Department).filter(Department.name == department_name).first()
        if dept:
            department_id = dept.id

    report = Report(
        title=title,
        description=description,
        category=category,
        location=location,
        latitude=latitude,
        longitude=longitude,
        photo_url=photo_url,
        citizen_id=current_user.id,
        ai_summary=ai_summary,
        priority=priority,
        department_id=department_id,
        status="pending"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Initial history
    history = ReportHistory(report_id=report.id, status="pending", changed_by_id=current_user.id)
    db.add(history)
    db.commit()

    report.history = db.query(ReportHistory).filter(ReportHistory.report_id == report.id).all()
    return report

@router.get("/", response_model=List[ReportResponse])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(Report).filter(Report.citizen_id == current_user.id).all()
    for report in reports:
        report.history = db.query(ReportHistory).filter(ReportHistory.report_id == report.id).all()
    return reports

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.history = db.query(ReportHistory).filter(ReportHistory.report_id == report.id).all()
    return report
