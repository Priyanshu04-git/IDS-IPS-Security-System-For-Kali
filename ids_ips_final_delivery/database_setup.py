#!/usr/bin/env python3
"""
Enhanced Database Setup for Persistent IDS/IPS Data Storage
Creates comprehensive tables for storing all dashboard data permanently
"""

import sqlite3
import os
from datetime import datetime
import json

def create_persistent_database(db_path):
    """Create enhanced database schema for persistent data storage"""
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create threats table for persistent threat data
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS threats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        threat_id TEXT UNIQUE NOT NULL,
        source_ip TEXT NOT NULL,
        destination_ip TEXT,
        threat_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        confidence REAL NOT NULL,
        detection_method TEXT,
        description TEXT,
        action_taken TEXT,
        blocked INTEGER DEFAULT 0,
        country TEXT,
        city TEXT,
        port INTEGER,
        protocol TEXT,
        payload_snippet TEXT,
        indicators TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create alerts table for security alerts
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT UNIQUE NOT NULL,
        timestamp TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        source_ip TEXT,
        destination_ip TEXT,
        threat_type TEXT,
        action_taken TEXT DEFAULT 'logged',
        acknowledged INTEGER DEFAULT 0,
        resolved INTEGER DEFAULT 0,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create system_stats table for dashboard metrics
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS system_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        total_events INTEGER DEFAULT 0,
        threats_detected INTEGER DEFAULT 0,
        alerts_generated INTEGER DEFAULT 0,
        ips_blocked INTEGER DEFAULT 0,
        packets_processed INTEGER DEFAULT 0,
        cpu_usage REAL DEFAULT 0.0,
        memory_usage REAL DEFAULT 0.0,
        network_activity REAL DEFAULT 0.0,
        uptime_seconds INTEGER DEFAULT 0,
        system_status TEXT DEFAULT 'online',
        components_status TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create blocked_ips table for IP blocking history
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS blocked_ips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        blocked_at TEXT NOT NULL,
        unblocked_at TEXT,
        reason TEXT,
        threat_type TEXT,
        duration_seconds INTEGER,
        auto_blocked INTEGER DEFAULT 1,
        active INTEGER DEFAULT 1,
        block_count INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create threat_intelligence table for IOC data
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS threat_intelligence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ioc_value TEXT NOT NULL,
        ioc_type TEXT NOT NULL,
        threat_type TEXT,
        severity TEXT,
        source TEXT,
        description TEXT,
        first_seen TEXT,
        last_seen TEXT,
        active INTEGER DEFAULT 1,
        confidence REAL DEFAULT 0.0,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create network_sessions table for connection tracking
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS network_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        source_ip TEXT NOT NULL,
        destination_ip TEXT NOT NULL,
        source_port INTEGER,
        destination_port INTEGER,
        protocol TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT,
        bytes_sent INTEGER DEFAULT 0,
        bytes_received INTEGER DEFAULT 0,
        packets_sent INTEGER DEFAULT 0,
        packets_received INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        flagged INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create reports table for generated reports
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT UNIQUE NOT NULL,
        report_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        time_range TEXT,
        start_date TEXT,
        end_date TEXT,
        generated_at TEXT NOT NULL,
        file_path TEXT,
        file_size INTEGER,
        status TEXT DEFAULT 'completed',
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create geographic_data table for threat locations
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS geographic_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        country TEXT,
        country_code TEXT,
        city TEXT,
        latitude REAL,
        longitude REAL,
        timezone TEXT,
        isp TEXT,
        organization TEXT,
        threat_count INTEGER DEFAULT 1,
        first_seen TEXT,
        last_seen TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create configuration table for system settings
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS configuration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        category TEXT,
        description TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create indexes for better performance
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_threats_timestamp ON threats(timestamp)",
        "CREATE INDEX IF NOT EXISTS idx_threats_source_ip ON threats(source_ip)",
        "CREATE INDEX IF NOT EXISTS idx_threats_type ON threats(threat_type)",
        "CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)",
        "CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity)",
        "CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip_address)",
        "CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(active)",
        "CREATE INDEX IF NOT EXISTS idx_system_stats_timestamp ON system_stats(timestamp)",
        "CREATE INDEX IF NOT EXISTS idx_sessions_source_ip ON network_sessions(source_ip)",
        "CREATE INDEX IF NOT EXISTS idx_sessions_status ON network_sessions(status)",
        "CREATE INDEX IF NOT EXISTS idx_geographic_ip ON geographic_data(ip_address)"
    ]
    
    for index_sql in indexes:
        cursor.execute(index_sql)
    
    # Insert default configuration
    default_configs = [
        ('data_retention_days', '30', 'database', 'Number of days to retain historical data'),
        ('auto_cleanup_enabled', 'true', 'database', 'Enable automatic cleanup of old data'),
        ('threat_threshold', '0.7', 'detection', 'Confidence threshold for threat classification'),
        ('auto_blocking_enabled', 'true', 'prevention', 'Enable automatic IP blocking'),
        ('block_duration_seconds', '3600', 'prevention', 'Default IP block duration'),
        ('dashboard_refresh_rate', '5', 'ui', 'Dashboard refresh rate in seconds'),
        ('max_alerts_display', '100', 'ui', 'Maximum alerts to display in dashboard'),
        ('system_initialized', datetime.now().isoformat(), 'system', 'System initialization timestamp')
    ]
    
    for key, value, category, description in default_configs:
        cursor.execute('''
        INSERT OR IGNORE INTO configuration (key, value, category, description) 
        VALUES (?, ?, ?, ?)
        ''', (key, value, category, description))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Enhanced database schema created at: {db_path}")
    print("📊 Tables created: threats, alerts, system_stats, blocked_ips, threat_intelligence, network_sessions, reports, geographic_data, configuration")
    
    return db_path

def seed_initial_data(db_path):
    """Seed database with some initial data for testing"""
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if we already have data
    cursor.execute("SELECT COUNT(*) FROM threats")
    threat_count = cursor.fetchone()[0]
    
    if threat_count == 0:
        print("🌱 Seeding initial threat data...")
        
        # Insert some sample threats for demonstration
        sample_threats = [
            {
                'threat_id': 'TH001',
                'timestamp': datetime.now().isoformat(),
                'source_ip': '203.0.113.15',
                'destination_ip': '192.168.1.100',
                'threat_type': 'Malware Communication',
                'severity': 'HIGH',
                'confidence': 0.95,
                'detection_method': 'Signature',
                'description': 'Suspicious C2 communication detected',
                'action_taken': 'blocked',
                'blocked': 1,
                'country': 'Unknown',
                'city': 'Unknown',
                'port': 443,
                'protocol': 'TCP',
                'payload_snippet': 'malicious_payload_data',
                'indicators': json.dumps(['suspicious_domain', 'known_c2_ip']),
                'metadata': json.dumps({'rule_id': 'R001', 'confidence_score': 0.95})
            },
            {
                'threat_id': 'TH002',
                'timestamp': datetime.now().isoformat(),
                'source_ip': '198.51.100.23',
                'destination_ip': '192.168.1.105',
                'threat_type': 'Port Scan',
                'severity': 'MEDIUM',
                'confidence': 0.85,
                'detection_method': 'Anomaly',
                'description': 'Port scanning activity detected',
                'action_taken': 'logged',
                'blocked': 0,
                'country': 'Unknown',
                'city': 'Unknown',
                'port': 22,
                'protocol': 'TCP',
                'payload_snippet': 'scan_attempt',
                'indicators': json.dumps(['rapid_connections', 'sequential_ports']),
                'metadata': json.dumps({'scan_ports': [22, 23, 80, 443], 'duration': 120})
            }
        ]
        
        for threat in sample_threats:
            cursor.execute('''
            INSERT INTO threats (
                threat_id, timestamp, source_ip, destination_ip, threat_type, 
                severity, confidence, detection_method, description, action_taken,
                blocked, country, city, port, protocol, payload_snippet, 
                indicators, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                threat['threat_id'], threat['timestamp'], threat['source_ip'],
                threat['destination_ip'], threat['threat_type'], threat['severity'],
                threat['confidence'], threat['detection_method'], threat['description'],
                threat['action_taken'], threat['blocked'], threat['country'],
                threat['city'], threat['port'], threat['protocol'],
                threat['payload_snippet'], threat['indicators'], threat['metadata']
            ))
        
        # Insert initial system stats
        cursor.execute('''
        INSERT INTO system_stats (
            timestamp, total_events, threats_detected, alerts_generated, 
            ips_blocked, packets_processed, cpu_usage, memory_usage, 
            network_activity, uptime_seconds, system_status, components_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(), 2, 2, 1, 1, 1250, 45.2, 62.8,
            128.5, 0, 'online', json.dumps({
                'packet_capture': True, 'signature_detection': True, 
                'anomaly_detection': True, 'ml_detection': True,
                'threat_scoring': True, 'ip_blocking': True,
                'logging': True, 'reporting': True
            })
        ))
        
        conn.commit()
        print("✅ Initial data seeded successfully")
    
    conn.close()

if __name__ == "__main__":
    # Setup database
    db_path = "/home/priyanshu/Desktop/ids_ips_final_delivery/ids_ips_final_delivery/logs/ids_events.db"
    
    print("🗄️  Setting up persistent database...")
    create_persistent_database(db_path)
    seed_initial_data(db_path)
    
    print("\n📋 Database setup complete!")
    print(f"   Location: {db_path}")
    print("   The system will now retain all data until manually deleted.")
    print("   Restart the backend to start using persistent storage.")
