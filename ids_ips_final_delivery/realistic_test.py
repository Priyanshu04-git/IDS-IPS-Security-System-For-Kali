#!/usr/bin/env python3
"""
Realistic network activity test to demonstrate improved threat detection.
This will generate normal traffic and some genuinely suspicious activity.
"""

import socket
import time
import threading
import requests
import subprocess
from concurrent.futures import ThreadPoolExecutor

def normal_web_browsing():
    """Simulate normal web browsing - should NOT trigger alerts"""
    print("🌐 Simulating normal web browsing...")
    try:
        # Normal HTTPS requests (should be fine)
        requests.get("https://www.google.com", timeout=5)
        requests.get("https://www.github.com", timeout=5)
        requests.get("https://httpbin.org/ip", timeout=5)
        print("✅ Normal web browsing completed - no alerts expected")
    except Exception as e:
        print(f"Web browsing failed: {e}")

def normal_dns_queries():
    """Simulate normal DNS queries - should NOT trigger alerts"""
    print("🔍 Simulating normal DNS queries...")
    try:
        socket.gethostbyname("www.example.com")
        socket.gethostbyname("www.google.com")
        socket.gethostbyname("www.github.com")
        print("✅ Normal DNS queries completed - no alerts expected")
    except Exception as e:
        print(f"DNS queries failed: {e}")

def simulate_port_scan():
    """Simulate a port scan - SHOULD trigger alert"""
    print("🚨 Simulating port scan attack...")
    target_ip = "127.0.0.1"  # Scan localhost
    suspicious_ports = [21, 22, 23, 25, 53, 80, 135, 443, 445, 1433]  # Multiple service ports
    
    def scan_port(port):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.1)
            result = sock.connect_ex((target_ip, port))
            sock.close()
        except:
            pass
    
    # Rapid scan of multiple ports (should trigger port scan detection)
    with ThreadPoolExecutor(max_workers=10) as executor:
        executor.map(scan_port, suspicious_ports)
    
    print("🎯 Port scan completed - SHOULD trigger port scan alert")

def simulate_ssh_brute_force():
    """Simulate SSH brute force - SHOULD trigger alert"""
    print("🔐 Simulating SSH brute force attack...")
    target_ip = "127.0.0.1"
    
    # Multiple rapid SSH connection attempts (should trigger brute force detection)
    for attempt in range(15):  # More than threshold of 10
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.1)
            sock.connect_ex((target_ip, 22))  # SSH port
            sock.close()
        except:
            pass
        time.sleep(0.05)  # Small delay between attempts
    
    print("🎯 SSH brute force completed - SHOULD trigger brute force alert")

def simulate_backdoor_communication():
    """Simulate communication with backdoor ports - SHOULD trigger alert"""
    print("🦠 Simulating backdoor communication...")
    target_ip = "127.0.0.1"
    backdoor_ports = [1234, 4444, 31337]  # Known backdoor ports
    
    for port in backdoor_ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.1)
            sock.connect_ex((target_ip, port))
            sock.close()
        except:
            pass
    
    print("🎯 Backdoor communication completed - SHOULD trigger malware alert")

def generate_normal_traffic():
    """Generate continuous normal traffic that should NOT trigger alerts"""
    print("📡 Generating normal background traffic...")
    for i in range(50):
        try:
            # Normal HTTP requests to different sites
            requests.get("https://httpbin.org/uuid", timeout=2)
            time.sleep(0.1)
        except:
            pass
    print("✅ Normal background traffic completed - no alerts expected")

def main():
    print("🔬 REALISTIC IDS/IPS TESTING")
    print("=" * 50)
    print("This test will generate:")
    print("✅ Normal traffic (should NOT trigger alerts)")
    print("🚨 Suspicious activities (SHOULD trigger alerts)")
    print("=" * 50)
    
    # Phase 1: Normal activities (should be quiet)
    print("\n📊 PHASE 1: Normal Network Activity")
    print("-" * 40)
    
    normal_web_browsing()
    time.sleep(2)
    
    normal_dns_queries()
    time.sleep(2)
    
    # Generate some normal background traffic
    normal_thread = threading.Thread(target=generate_normal_traffic)
    normal_thread.start()
    
    time.sleep(5)
    
    # Phase 2: Suspicious activities (should trigger alerts)
    print("\n🚨 PHASE 2: Suspicious Network Activity")
    print("-" * 40)
    
    simulate_port_scan()
    time.sleep(3)
    
    simulate_ssh_brute_force()
    time.sleep(3)
    
    simulate_backdoor_communication()
    time.sleep(3)
    
    # Wait for background traffic to complete
    normal_thread.join()
    
    print("\n✅ TESTING COMPLETED")
    print("=" * 50)
    print("Check the IDS dashboard for results:")
    print("• Normal activities should show minimal/no alerts")
    print("• Suspicious activities should show targeted alerts")
    print("• This demonstrates realistic threat detection!")

if __name__ == "__main__":
    main()
