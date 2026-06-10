import sqlite3
from pathlib import Path

from config import DATABASE_PATH

DB_FILE = Path(DATABASE_PATH).expanduser()
DB_FILE.parent.mkdir(parents=True, exist_ok=True)


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS knowledge_base_documents (
                id TEXT PRIMARY KEY,
                user_email TEXT NOT NULL,
                filename TEXT NOT NULL,
                created_at TEXT NOT NULL,
                size INTEGER NOT NULL,
                chunks INTEGER NOT NULL,
                metadata TEXT
            )
            """
        )
        conn.commit()
