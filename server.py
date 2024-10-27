from fastapi import FastAPI, HTTPException
import sqlite3
import datetime
import toml
import os
import threading  # 引入 threading 模块

def parse_duration(duration_str):
    """解析时间窗口字符串，例如 '1h', '30m', '2d'"""
    unit = duration_str[-1]
    value = int(duration_str[:-1])
    if unit == 'h':
        return datetime.timedelta(hours=value)
    elif unit == 'm':
        return datetime.timedelta(minutes=value)
    elif unit == 's':
        return datetime.timedelta(seconds=value)
    elif unit == 'd':
        return datetime.timedelta(days=value)
    else:
        raise ValueError(f"无法解析时间窗口：{duration_str}")

# 读取配置文件
config_file = 'config.toml'
if not os.path.exists(config_file):
    raise FileNotFoundError("配置文件 config.toml 不存在。")

config = toml.load(config_file)
windows = config.get('windows', {})
windows = {k: parse_duration(v) for k, v in windows.items()}
limits = config.get('limits', {})
limits = {k: int(limits[k]) for k in windows.keys()}

# 初始化数据库
conn = sqlite3.connect('sqlite.db', check_same_thread=False)
cursor = conn.cursor()
cursor.execute('''
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        timestamp DATETIME NOT NULL
    )
''')
conn.commit()

lock = threading.Lock()

app = FastAPI()

@app.put("/")
def report(model: str):
    if model not in windows:
        raise HTTPException(status_code=400, detail="unknown model")
    timestamp = datetime.datetime.now()

    with lock:
        cursor.execute(
            "INSERT INTO sales (model, timestamp) VALUES (?, ?)",
            (model, timestamp)
        )
        conn.commit()

    return {'ok': True}

@app.get("/")
def status(model: str):
    if model not in windows:
        raise HTTPException(status_code=400, detail="unknown model")
    window = windows[model]
    end_time = datetime.datetime.now()
    start_time = end_time - window

    with lock:
        cursor.execute(
            "SELECT COUNT(*) FROM sales WHERE model = ? AND timestamp BETWEEN ? AND ?",
            (model, start_time, end_time)
        )
        count = cursor.fetchone()[0]

    return {
        "model": model,
        "window": str(window),
        "remain": limits[model] - count
    }
