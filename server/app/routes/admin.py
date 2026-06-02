from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.report import Report
from app.models.report_history import ReportHistory
from app.schemas.report import ReportResponse, ReportUpdate
from app.middleware.auth import require_admin
from app.models.user import User
from app.models.department import Department

router = APIRouter()

@router.get("/departments")
def get_departments(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(Department).all()

@router.get("/reports", response_model=List[ReportResponse])
def get_all_reports(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    reports = db.query(Report).all()
    for report in reports:
        report.history = db.query(ReportHistory).filter(ReportHistory.report_id == report.id).all()
    return reports

@router.put("/reports/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: int,
    update_data: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    old_status = report.status
    
    for key, value in update_data.model_dump(exclude_none=True).items():
        setattr(report, key, value)
        
    db.commit()
    db.refresh(report)
    
    if update_data.status and update_data.status != old_status:
        history = ReportHistory(report_id=report.id, status=update_data.status, changed_by_id=current_user.id)
        db.add(history)
        db.commit()
        
    report.history = db.query(ReportHistory).filter(ReportHistory.report_id == report.id).all()
    return report
