import sqlite3

def run_cleanup():
    conn = sqlite3.connect('C:/Users/Miguel Gonzalez/Downloads/NOM-035/nom035.db')
    cursor = conn.cursor()
    
    # Delete dummy tasks
    cursor.execute("""
        DELETE FROM action_plans 
        WHERE description LIKE 'Acción recomendada para mitigar el riesgo%'
    """)
    deleted_count = cursor.rowcount
    
    conn.commit()
    conn.close()
    
    print(f"Borradas {deleted_count} tareas repetidas de la base de datos.")

if __name__ == "__main__":
    run_cleanup()
