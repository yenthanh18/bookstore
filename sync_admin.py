import sqlite3

def sync_admin_email():
    conn = sqlite3.connect('d:/7.CTU/DigitalMarketing/SmartBook/smartbook.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET email='admin@smartbook.ai' WHERE email='admin@smartbook.local'")
    conn.commit()
    
    cursor.execute("SELECT id, email, role FROM users WHERE role='admin'")
    print("New Admin State:", cursor.fetchall())
    conn.close()

if __name__ == "__main__":
    sync_admin_email()
