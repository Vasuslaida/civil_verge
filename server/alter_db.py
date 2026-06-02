import pymysql
from app.config import settings
from urllib.parse import urlparse

def alter_db():
    parsed = urlparse(settings.DATABASE_URL)
    conn = pymysql.connect(
        host=parsed.hostname,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path[1:],
        port=parsed.port or 3306
    )
    cursor = conn.cursor()
    
    # Check reports table columns
    cursor.execute("SHOW COLUMNS FROM reports")
    columns = [row[0] for row in cursor.fetchall()]
    
    if 'latitude' not in columns:
        cursor.execute("ALTER TABLE reports ADD COLUMN latitude FLOAT NULL")
        print("Added latitude")
    if 'longitude' not in columns:
        cursor.execute("ALTER TABLE reports ADD COLUMN longitude FLOAT NULL")
        print("Added longitude")
    if 'priority' not in columns:
        cursor.execute("ALTER TABLE reports ADD COLUMN priority VARCHAR(20) DEFAULT 'medium'")
        print("Added priority")
    if 'photo_url' not in columns:
        cursor.execute("ALTER TABLE reports ADD COLUMN photo_url VARCHAR(255) NULL")
        print("Added photo_url")
    if 'department_id' not in columns:
        cursor.execute("ALTER TABLE reports ADD COLUMN department_id INT NULL")
        try:
            cursor.execute("ALTER TABLE reports ADD CONSTRAINT fk_report_dept FOREIGN KEY (department_id) REFERENCES departments(id)")
        except:
            pass
        print("Added department_id")

    conn.commit()
    conn.close()
    print("DB altered successfully.")

if __name__ == "__main__":
    alter_db()
