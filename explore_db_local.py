import sqlite3
import os

def explore_db():
    db_path = 'smartbook.db'
    if not os.path.exists(db_path):
        print(f"File not found: {db_path}")
        return
        
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("Tables:", tables)
        
        # Check users table
        if ('user',) in tables:
            cursor.execute("SELECT id, email, role FROM user")
            users = cursor.fetchall()
            print("Users:", users)
        elif ('users',) in tables:
            cursor.execute("SELECT id, email, role FROM users")
            users = cursor.fetchall()
            print("Users:", users)
        else:
            print("No user table found. Tables are:", tables)
            
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    explore_db()
