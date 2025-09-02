#!/usr/bin/env python3
"""
Test and demonstrate real threat detection capabilities
"""

import subprocess
import time
import threading
import socket
import requests
from real_ids_engine import RealIDSEngine

def generate_test_traffic():
    """Generate various types of network traffic to trigger detection"""
    print("\n🚀 Generating test network traffic...")
    
    test_activities = [
        ("Port Scan Simulation", simulate_port_scan),
        ("Large Packet Test", simulate_large_packet),
        ("HTTP Request Test", simulate_http_requests),
        ("SSH Connection Test", simulate_ssh_attempt),
        ("High Port Connection", simulate_high_port_connection)
    ]
    
    for name, func in test_activities:
        try:
            print(f"\n🔍 Running: {name}")
            func()
            time.sleep(2)  # Brief pause between tests
        except Exception as e:
            print(f"   ⚠️ {name} failed: {e}")

def simulate_port_scan():
    """Simulate port scanning activity"""
    target_host = "127.0.0.1"
    common_ports = [22, 23, 80, 443, 135, 139, 445, 1433, 3389]
    
    for port in common_ports[:5]:  # Scan first 5 ports
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.1)
            result = sock.connect_ex((target_host, port))
            sock.close()
            print(f"   📡 Scanned port {port}")
        except:
            pass

def simulate_large_packet():
    """Simulate large packet transmission"""
    try:
        # Create a large HTTP POST request
        large_data = "A" * 10000  # 10KB payload
        response = requests.post("http://httpbin.org/post", 
                               data=large_data, 
                               timeout=2)
        print(f"   📦 Sent large packet: {len(large_data)} bytes")
    except:
        print("   📦 Large packet test (connection failed - normal)")

def simulate_http_requests():
    """Simulate HTTP requests"""
    try:
        requests.get("http://httpbin.org/get", timeout=2)
        print("   🌐 HTTP GET request")
    except:
        print("   🌐 HTTP test (connection failed - normal)")

def simulate_ssh_attempt():
    """Simulate SSH connection attempt"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        sock.connect_ex(("127.0.0.1", 22))
        sock.close()
        print("   🔐 SSH connection attempt to port 22")
    except:
        print("   🔐 SSH test completed")

def simulate_high_port_connection():
    """Simulate connection to high-numbered port"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        sock.connect_ex(("127.0.0.1", 55555))  # High port number
        sock.close()
        print("   🎯 High port connection (55555)")
    except:
        print("   🎯 High port test completed")

def test_real_ids_with_traffic():
    """Test the real IDS with generated traffic"""
    print("🎯 Testing Real IDS/IPS System with Network Traffic")
    print("=" * 60)
    
    # Initialize IDS engine
    print("\n📡 Initializing Real IDS Engine...")
    ids_engine = RealIDSEngine()
    
    if not ids_engine.start():
        print("❌ Failed to start IDS engine")
        return
    
    print("✅ IDS Engine started successfully!")
    print("🔍 Monitoring network traffic...")
    
    # Wait a moment for initialization
    time.sleep(2)
    
    # Generate test traffic in background thread
    traffic_thread = threading.Thread(target=generate_test_traffic, daemon=True)
    traffic_thread.start()
    
    # Monitor for threats
    print("\n🚨 Monitoring for threats (30 seconds)...")
    start_time = time.time()
    threat_count = 0
    
    try:
        while time.time() - start_time < 30:
            # Check for detected threats
            recent_threats = ids_engine.get_recent_threats(limit=5)
            
            for threat in recent_threats:
                threat_count += 1
                print(f"\n🚨 THREAT #{threat_count} DETECTED:")
                print(f"   Type: {threat.get('threat_type', 'unknown')}")
                print(f"   Source: {threat.get('source_ip', 'unknown')}")
                print(f"   Severity: {threat.get('severity', 'unknown')}")
                print(f"   Description: {threat.get('description', 'No description')}")
                print(f"   Confidence: {threat.get('confidence', 0)}")
            
            # Show statistics
            stats = ids_engine.get_stats()
            if stats['packets_captured'] > 0:
                print(f"\r📊 Packets: {stats['packets_captured']} captured, "
                     f"{stats['packets_processed']} processed, "
                     f"{stats['threats_detected']} threats detected", end="")
            
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("\n⏹️ Monitoring interrupted by user")
    
    # Final statistics
    print(f"\n\n📊 Final Statistics:")
    final_stats = ids_engine.get_stats()
    print(f"   📡 Packets Captured: {final_stats['packets_captured']}")
    print(f"   🔄 Packets Processed: {final_stats['packets_processed']}")
    print(f"   🚨 Threats Detected: {final_stats['threats_detected']}")
    print(f"   ⏱️ Packets/Second: {final_stats.get('packets_per_second', 0):.2f}")
    print(f"   🎯 Detection Rate: {threat_count} real-time alerts")
    
    # Stop the engine
    ids_engine.stop()
    print("\n✅ Test completed successfully!")
    
    # Recommendations
    if final_stats['threats_detected'] > 0:
        print("\n💡 RESULTS:")
        print("   ✅ Real threat detection is WORKING!")
        print("   🛡️ The system detected actual network activity")
        print("   📈 This demonstrates real IDS capabilities")
    else:
        print("\n💡 RESULTS:")
        print("   ⚠️ No threats detected during test")
        print("   🔍 This could mean:")
        print("      • Network interface had no traffic")
        print("      • Detection thresholds are too high")
        print("      • Permissions issue with packet capture")

if __name__ == "__main__":
    # Check if running as root (needed for packet capture)
    import os
    if os.geteuid() != 0:
        print("⚠️ WARNING: Not running as root.")
        print("📝 Packet capture may not work without proper permissions.")
        print("💡 For full functionality, run with: sudo python3 test_real_ids.py")
        print()
    
    test_real_ids_with_traffic()
