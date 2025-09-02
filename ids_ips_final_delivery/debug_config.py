#!/usr/bin/env python3
import sqlite3
import json
import os
from datetime import datetime

# Check database
db_path = 'logs/ids_events.db'
print(f"Checking database at: {db_path}")
print(f"Database exists: {os.path.exists(db_path)}")

if os.path.exists(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # List all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"Available tables: {[table[0] for table in tables]}")
        
        # Check if configuration table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='configuration'")
        config_table = cursor.fetchone()
        print(f"Configuration table exists: {config_table is not None}")
        
        if config_table:
            # Try to read from configuration table
            cursor.execute("SELECT key, value FROM configuration")
            configs = cursor.fetchall()
            print(f"Configurations in database: {len(configs)}")
            for key, value in configs:
                print(f"  {key}: {value[:100]}..." if len(value) > 100 else f"  {key}: {value}")
                
            # Test saving a configuration
            test_config = {"test": "value", "timestamp": datetime.now().isoformat()}
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO configuration (key, value, updated_at)
                VALUES (?, ?, ?)
                ''', ('system_config', json.dumps(test_config), datetime.now().isoformat()))
                conn.commit()
                print("✅ Successfully saved test configuration")
            except Exception as e:
                print(f"❌ Error saving configuration: {e}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")
else:
    print("❌ Database file doesn't exist!")
