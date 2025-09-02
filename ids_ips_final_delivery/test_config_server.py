#!/usr/bin/env python3
"""
Simple test server to debug the configuration endpoint issue
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Simple database class for testing
class TestDatabaseManager:
    def __init__(self, db_path):
        self.db_path = db_path
    
    def save_configuration(self, config_data):
        """Save configuration to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
            INSERT OR REPLACE INTO configuration (key, value, updated_at)
            VALUES (?, ?, ?)
            ''', ('system_config', json.dumps(config_data), datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Database save error: {e}")
            return False

# Initialize test db manager
db_manager = TestDatabaseManager('../../logs/ids_events.db')

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get current configuration"""
    return jsonify({
        "test": "current_config",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/config', methods=['PUT'])
def update_config():
    """Update system configuration - simplified version"""
    try:
        print("=== Configuration Update Request ===")
        
        # Get request data
        new_config = request.get_json()
        print(f"Received config data: {new_config}")
        
        if not new_config:
            print("ERROR: No configuration data provided")
            return jsonify({"error": "No configuration data provided"}), 400
        
        # Test database save
        print("Attempting to save to database...")
        success = db_manager.save_configuration(new_config)
        
        if not success:
            print("ERROR: Database save failed")
            return jsonify({"error": "Failed to save configuration to database"}), 500
        
        print("✅ Database save successful")
        
        # Return success response
        response = {
            "status": "updated", 
            "timestamp": datetime.now().isoformat(),
            "message": "Configuration saved to database",
            "config_received": new_config
        }
        
        print(f"Returning response: {response}")
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Configuration update error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint"""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

if __name__ == '__main__':
    print("Starting test configuration server on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=True)
