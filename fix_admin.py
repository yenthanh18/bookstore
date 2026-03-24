import sqlite3
import os

def fix_admin_role():
    db_path = 'd:/7.CTU/DigitalMarketing/SmartBook/smartbook.db'
    if not os.path.exists(db_path):
        print(f"File not found: {db_path}")
        return
        
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current role
        cursor.execute("SELECT id, email, role FROM users WHERE email='admin@smartbook.ai'")
        user = cursor.fetchone()
        
        if user:
            print(f"Found admin user: {user}. Updating role...")
            cursor.execute("UPDATE users SET role='admin' WHERE email='admin@smartbook.ai'")
            conn.commit()
            
            # Verify update
            cursor.execute("SELECT id, email, role FROM users WHERE email='admin@smartbook.ai'")
            user = cursor.fetchone()
            print(f"Updated admin user: {user}")
        else:
            print("Admin user not found. Run init_db.py first.")
            
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    fix_admin_role()
