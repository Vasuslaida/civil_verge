from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.report import Report
from app.models.department import Department
from app.middleware.auth import require_admin
from app.models.user import User

router = APIRouter()

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total = db.query(Report).count()
    open_count = db.query(Report).filter(Report.status == "pending").count()
    resolved = db.query(Report).filter(Report.status == "resolved").count()
    in_progress = db.query(Report).filter(Report.status == "in_progress").count()
    
    # Category Distribution
    categories = db.query(Report.category, func.count(Report.id)).group_by(Report.category).all()
    category_data = [{"name": c[0], "value": c[1]} for c in categories]
    
    # Priority Distribution
    priorities = db.query(Report.priority, func.count(Report.id)).group_by(Report.priority).all()
    priority_data = [{"name": p[0], "value": p[1]} for p in priorities]
    
    # Department Distribution
    departments = db.query(Department.name, func.count(Report.id)).outerjoin(Report, Department.id == Report.department_id).group_by(Department.name).all()
    department_data = [{"name": d[0], "value": d[1]} for d in departments]

    total_users = db.query(User).count()
    most_common_category = "N/A"
    if category_data:
        most_common_category = max(category_data, key=lambda x: x["value"])["name"]

    return {
        "totalReportsResolved": resolved,
        "totalUsers": total_users,
        "mostCommonCategory": most_common_category,
        "summary": {"total_reports": total, "open": open_count, "in_progress": in_progress, "resolved": resolved},
        "categories": category_data,
        "priorities": priority_data,
        "departments": department_data
    }

