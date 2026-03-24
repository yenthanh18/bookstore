import sqlite3

def explore_db():
    conn = sqlite3.connect('d:/7.CTU/DigitalMarketing/SmartBook/smartbook.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, role FROM users")
    users = cursor.fetchall()
    with open('d:/7.CTU/DigitalMarketing/SmartBook/users_list.txt', 'w') as f:
        for u in users:
            f.write(f"{u[0]} | {u[1]} | {u[2]}\n")
    conn.close()

if __name__ == "__main__":
    explore_db()
