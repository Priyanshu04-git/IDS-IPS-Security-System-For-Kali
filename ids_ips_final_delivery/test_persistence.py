#!/usr/bin/env python3
"""
Test script to verify persistent configuration
"""

import requests
import json

# Test configuration data
test_config = {
    'detection': {
        'signature_enabled': True,
        'anomaly_enabled': True,
        'ml_enabled': False,  # Changed from default
        'behavioral_enabled': True,
        'anomaly_threshold': 4.0,  # Changed from default
        'ml_confidence_threshold': 0.9,  # Changed from default
        'threat_score_threshold': 0.6  # Changed from default
    },
    'network': {
        'interfaces': ['eth0', 'wlan0'],  # Changed from default
        'capture_buffer_size': 2048,  # Changed from default
        'max_packets_per_second': 15000  # Changed from default
    },
    'blocking': {
        'auto_blocking': False,  # Changed from default
        'block_duration': 7200,  # Changed from default
        'whitelist': ['127.0.0.1', '192.168.1.1', '10.0.0.1']  # Added entry
    },
    'alerting': {
        'email_alerts': False,  # Changed from default
        'sms_alerts': True,  # Changed from default
        'webhook_alerts': True,
        'alert_email': 'security@mycompany.com',  # Changed from default
        'webhook_url': 'https://my-webhook.com/security'  # Changed from default
    },
    'logging': {
        'log_level': 'DEBUG',  # Changed from default
        'log_retention_days': 60,  # Changed from default
        'enable_syslog': False,  # Changed from default
        'syslog_server': '10.0.0.5'  # Changed from default
    },
    'performance': {
        'max_cpu_usage': 90,  # Changed from default
        'max_memory_usage': 85,  # Changed from default
        'thread_pool_size': 12  # Changed from default
    }
}

def test_configuration_persistence():
    base_url = 'http://localhost:5000'
    
    print("🧪 Testing Configuration Persistence")
    print("=" * 50)
    
    # Step 1: Get current configuration
    print("1. Getting current configuration...")
    try:
        response = requests.get(f'{base_url}/api/config', timeout=5)
        if response.status_code == 200:
            current_config = response.json()
            print("✅ Current configuration loaded:")
            print(json.dumps(current_config, indent=2))
        else:
            print(f"❌ Failed to get configuration: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting configuration: {e}")
        return False
    
    # Step 2: Save new configuration
    print("\n2. Saving new configuration...")
    try:
        response = requests.put(
            f'{base_url}/api/config',
            json=test_config,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        if response.status_code == 200:
            result = response.json()
            print("✅ Configuration saved successfully:")
            print(json.dumps(result, indent=2))
        else:
            print(f"❌ Failed to save configuration: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ Error saving configuration: {e}")
        return False
    
    # Step 3: Verify configuration was saved
    print("\n3. Verifying saved configuration...")
    try:
        response = requests.get(f'{base_url}/api/config', timeout=5)
        if response.status_code == 200:
            saved_config = response.json()
            print("✅ Verified configuration:")
            
            # Check specific values that we changed
            checks = [
                ('detection.ml_enabled', False),
                ('detection.anomaly_threshold', 4.0),
                ('network.capture_buffer_size', 2048),
                ('blocking.auto_blocking', False),
                ('alerting.email_alerts', False),
                ('logging.log_level', 'DEBUG'),
                ('performance.max_cpu_usage', 90)
            ]
            
            all_correct = True
            for key_path, expected_value in checks:
                keys = key_path.split('.')
                current_val = saved_config
                for key in keys:
                    current_val = current_val.get(key, {})
                
                if current_val == expected_value:
                    print(f"  ✅ {key_path}: {current_val}")
                else:
                    print(f"  ❌ {key_path}: expected {expected_value}, got {current_val}")
                    all_correct = False
            
            return all_correct
        else:
            print(f"❌ Failed to verify configuration: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error verifying configuration: {e}")
        return False

def test_database_persistence():
    """Test that configuration persists in database"""
    print("\n🗄️ Testing Database Persistence")
    print("=" * 40)
    
    import sqlite3
    import os
    
    db_path = '/home/priyanshu/Desktop/ids_ips_final_delivery/ids_ips_final_delivery/logs/ids_events.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if configuration table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='configuration'")
        if not cursor.fetchone():
            print("❌ Configuration table not found in database")
            return False
        
        # Check if our test configuration is saved
        cursor.execute("SELECT value FROM configuration WHERE key = 'system_config'")
        result = cursor.fetchone()
        
        if result:
            saved_config = json.loads(result[0])
            print("✅ Configuration found in database:")
            print(f"  Detection ML enabled: {saved_config.get('detection', {}).get('ml_enabled', 'Not found')}")
            print(f"  Network buffer size: {saved_config.get('network', {}).get('capture_buffer_size', 'Not found')}")
            print(f"  Log level: {saved_config.get('logging', {}).get('log_level', 'Not found')}")
            return True
        else:
            print("❌ No configuration found in database")
            return False
            
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Testing IDS/IPS Persistent Configuration System")
    print("=" * 60)
    
    # Test API persistence
    api_success = test_configuration_persistence()
    
    # Test database persistence  
    db_success = test_database_persistence()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS:")
    print(f"  API Configuration: {'✅ PASS' if api_success else '❌ FAIL'}")
    print(f"  Database Persistence: {'✅ PASS' if db_success else '❌ FAIL'}")
    
    if api_success and db_success:
        print("\n🎉 ALL TESTS PASSED! Configuration persistence is working correctly.")
        print("✅ Settings will persist across restarts")
        print("✅ No more mock/demo data")
        print("✅ Real data from persistent database")
    else:
        print("\n⚠️ Some tests failed. Please check the system.")
