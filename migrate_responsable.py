import sys
import os
import sqlite3

# Path to the database
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'nom035.db'))

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    sys.exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE action_plans ADD COLUMN assigned_to VARCHAR")
    print("Column 'assigned_to' added successfully to 'action_plans'.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("Column 'assigned_to' already exists.")
    else:
        print(f"Error: {e}")

conn.commit()
conn.close()
