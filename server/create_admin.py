from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.department import Department
from app.routes.auth import hash_password

def init_db():
    print("Initializing DB...")
    # Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Create Departments
    departments = ["Roads", "Water", "Sanitation", "Parks", "Electricity", "Noise"]
    for dept_name in departments:
        dept = db.query(Department).filter(Department.name == dept_name).first()
        if not dept:
            new_dept = Department(name=dept_name, description=f"Department of {dept_name}")
            db.add(new_dept)
            print(f"Created department: {dept_name}")
            
    db.commit()
    
    # Create Admin User
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        new_admin = User(
            username="admin",
            email="admin@civilverge.city",
            password_hash=hash_password("admin123"),
            role="admin"
        )
        db.add(new_admin)
        print("Created admin user: admin / admin123")
        
    db.commit()
    db.close()
    print("DB Initialization complete.")

if __name__ == "__main__":
    init_db()
