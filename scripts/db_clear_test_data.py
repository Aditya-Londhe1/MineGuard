import sqlite3

# Clear test operational data so live hardware data starts from a clean slate.
# The `users` table (login credentials) is intentionally preserved.
OPERATIONAL_TABLES = [
    "safety_event_audits",
    "alerts",
    "sensor_readings",
    "workers",
]

connection = sqlite3.connect("mineguard.db")
for table in OPERATIONAL_TABLES:
    deleted = connection.execute(f'DELETE FROM "{table}"').rowcount
    print(f"Cleared {table}: {deleted} rows")

connection.commit()

print("\nRemaining rows:")
for (name,) in connection.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence' ORDER BY name"
).fetchall():
    count = connection.execute(f'SELECT COUNT(*) FROM "{name}"').fetchone()[0]
    print(f"  {name}: {count}")

connection.close()
