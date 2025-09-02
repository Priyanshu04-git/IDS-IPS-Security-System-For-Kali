#!/usr/bin/env python3
"""
Realistic attack simulation to test the credible IDS/IPS system.
This will generate REAL suspicious network activity that should trigger genuine alerts.
"""

import socket
import time
import threading
import subprocess
import requests
from concurrent.futures import ThreadPoolExecutor

def normal_activity():
    """Generate normal network activity that should NOT trigger alerts"""
    print("✅ Generating normal network activity...")
    try:
        # Normal web requests
        requests.get("https://httpbin.org/get", timeout=3)
        requests.get("https://jsonplaceholder.typicode.com/posts/1", timeout=3)
        print("✅ Normal web browsing - should be clean")
    except Exception as e:
        print(f"Normal activity error: {e}")

def realistic_port_scan():
    """Perform a realistic port scan that SHOULD trigger detection"""
    print("🎯 Performing realistic port scan...")
    target = "127.0.0.1"
    
    # Scan common service ports (should trigger after 5+ ports, 3+ service ports)
    common_ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1433, 3389]
    
    def scan_port(port):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.2)
            result = sock.connect_ex((target, port))
            sock.close()
            time.sleep(0.1)  # Small delay between scans
        except:
            pass
    
    # Scan enough ports to trigger detection (need 5+ with 3+ service ports)
    with ThreadPoolExecutor(max_workers=5) as executor:
        executor.map(scan_port, common_ports[:8])  # Scan 8 service ports
    
    print("🚨 Port scan completed - SHOULD trigger port scan alert")

def realistic_ssh_brute_force():
    """Simulate SSH brute force that SHOULD trigger detection"""
    print("🔐 Simulating SSH brute force...")
    target = "127.0.0.1"
    ssh_port = 22
    
    # Generate more than 10 SSH attempts to trigger detection
    for attempt in range(15):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.1)
            sock.connect_ex((target, ssh_port))
            sock.close()
            time.sleep(0.05)
        except:
            pass
    
    print("🚨 SSH brute force completed - SHOULD trigger brute force alert")

def backdoor_communication():
    """Attempt communication with known backdoor ports"""
    print("🦠 Testing backdoor port communication...")
    target = "127.0.0.1"
    backdoor_ports = [1234, 4444, 31337]  # Known backdoor ports
    
    for port in backdoor_ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.1)
            sock.connect_ex((target, port))
            sock.close()
        except:
            pass
    
    print("🚨 Backdoor communication completed - SHOULD trigger malware alert")

def high_volume_traffic():
    """Generate high volume traffic to test DDoS detection"""
    print("📊 Generating high volume traffic...")
    target = "127.0.0.1"
    
    # Generate more than 100 packets from same IP to trigger DDoS detection
    def generate_traffic():
        for i in range(120):  # More than threshold of 100
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(0.05)
                sock.connect_ex((target, 80))
                sock.close()
            except:
                pass
    
    generate_traffic()
    print("🚨 High volume traffic completed - SHOULD trigger DDoS alert")

def main():
    print("🔬 CREDIBLE IDS/IPS REALISTIC TESTING")
    print("=" * 60)
    print("This test will ONLY generate genuinely suspicious activity")
    print("The system should be mostly QUIET with only targeted alerts")
    print("=" * 60)
    
    # Phase 1: Some normal activity (should be quiet)
    print("\n✅ PHASE 1: Normal Activity (should be quiet)")
    print("-" * 50)
    normal_activity()
    time.sleep(3)
    
    # Phase 2: Realistic attacks (should trigger specific alerts)
    print("\n🚨 PHASE 2: Realistic Attack Simulation")
    print("-" * 50)
    
    print("\n1. Port Scan Attack...")
    realistic_port_scan()
    time.sleep(5)
    
    print("\n2. SSH Brute Force Attack...")
    realistic_ssh_brute_force()
    time.sleep(5)
    
    print("\n3. Backdoor Communication...")
    backdoor_communication()
    time.sleep(5)
    
    print("\n4. High Volume Traffic...")
    high_volume_traffic()
    time.sleep(5)
    
    print("\n✅ REALISTIC TESTING COMPLETED")
    print("=" * 60)
    print("Expected Results:")
    print("• 🚨 Port Scan Alert (after scanning 8 service ports)")
    print("• 🚨 SSH Brute Force Alert (after 15 attempts)")
    print("• 🚨 Malware Alert (backdoor port communication)")
    print("• 🚨 DDoS Alert (high packet volume)")
    print("• ✅ Normal activity should generate NO alerts")
    print("• 📊 Total: ~4 targeted alerts (realistic for production)")
    print("=" * 60)

if __name__ == "__main__":
    main()
