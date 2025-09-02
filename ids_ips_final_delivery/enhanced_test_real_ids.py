#!/usr/bin/env python3
"""
Enhanced test that generates real network traffic that can be captured
"""

import subprocess
import time
import threading
import requests
import socket
from real_ids_engine import RealIDSEngine

def generate_external_traffic():
    """Generate traffic that goes through network interfaces"""
    print("\n🌐 Generating external network traffic...")
    
    # List of external services to test with
    test_urls = [
        "http://httpbin.org/get",
        "http://example.com",
        "http://google.com",
        "http://github.com",
    ]
    
    for i, url in enumerate(test_urls):
        try:
            print(f"   📡 Request {i+1}: {url}")
            response = requests.get(url, timeout=3)
            print(f"      ✅ Status: {response.status_code}")
            time.sleep(1)
        except Exception as e:
            print(f"      ⚠️ Failed: {e}")

def generate_ping_traffic():
    """Generate ICMP traffic using ping"""
    print("\n📡 Generating ICMP traffic...")
    
    targets = ["8.8.8.8", "1.1.1.1", "google.com"]
    
    for target in targets:
        try:
            print(f"   🏓 Pinging {target}")
            result = subprocess.run(
                ["ping", "-c", "3", target], 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            if result.returncode == 0:
                print(f"      ✅ Ping successful")
            else:
                print(f"      ⚠️ Ping failed")
        except Exception as e:
            print(f"      ⚠️ Error: {e}")

def generate_dns_traffic():
    """Generate DNS queries"""
    print("\n🔍 Generating DNS queries...")
    
    domains = ["google.com", "github.com", "stackoverflow.com", "malicious-test-domain.com"]
    
    for domain in domains:
        try:
            print(f"   🌐 DNS lookup: {domain}")
            socket.gethostbyname(domain)
            print(f"      ✅ Resolved")
        except Exception as e:
            print(f"      ⚠️ Failed: {e}")
        time.sleep(0.5)

def enhanced_network_test():
    """Enhanced test with real network traffic"""
    print("🚀 Enhanced Real IDS/IPS Test with Network Traffic")
    print("=" * 60)
    
    # Initialize IDS engine
    print("\n📡 Initializing Enhanced Real IDS Engine...")
    ids_engine = RealIDSEngine()
    
    if not ids_engine.start():
        print("❌ Failed to start IDS engine")
        return
    
    print("✅ IDS Engine started successfully!")
    print("🔍 Monitoring ALL network interfaces...")
    
    # Wait for initialization
    time.sleep(3)
    
    # Generate different types of traffic in parallel
    traffic_functions = [
        generate_external_traffic,
        generate_ping_traffic,
        generate_dns_traffic
    ]
    
    threads = []
    for func in traffic_functions:
        thread = threading.Thread(target=func, daemon=True)
        threads.append(thread)
        thread.start()
    
    # Monitor for threats
    print("\n🚨 Active monitoring for 45 seconds...")
    start_time = time.time()
    threat_count = 0
    last_packet_count = 0
    
    try:
        while time.time() - start_time < 45:
            # Check for detected threats
            recent_threats = ids_engine.get_recent_threats(limit=10)
            
            for threat in recent_threats:
                threat_count += 1
                print(f"\n🚨 REAL THREAT #{threat_count} DETECTED:")
                print(f"   🎯 Type: {threat.get('threat_type', 'unknown')}")
                print(f"   📍 Source: {threat.get('source_ip', 'unknown')}:{threat.get('port', 'N/A')}")
                print(f"   ⚠️ Severity: {threat.get('severity', 'unknown')}")
                print(f"   📝 Description: {threat.get('description', 'No description')}")
                print(f"   🎲 Confidence: {threat.get('confidence', 0):.1f}")
                print(f"   🔧 Method: {threat.get('detection_method', 'unknown')}")
            
            # Show live statistics
            stats = ids_engine.get_stats()
            
            # Check if we're actually capturing packets
            if stats['packets_captured'] > last_packet_count:
                last_packet_count = stats['packets_captured']
                print(f"\r📊 LIVE: {stats['packets_captured']} packets captured, "
                     f"{stats['packets_processed']} processed, "
                     f"{stats['threats_detected']} threats found", end="")
            elif stats['packets_captured'] == 0:
                print(f"\r⏳ Waiting for network traffic... ({int(time.time() - start_time)}s)", end="")
            
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("\n⏹️ Monitoring interrupted by user")
    
    # Wait for traffic generation to complete
    for thread in threads:
        thread.join(timeout=5)
    
    # Final statistics
    print(f"\n\n📊 FINAL RESULTS:")
    final_stats = ids_engine.get_stats()
    print(f"   📡 Total Packets Captured: {final_stats['packets_captured']}")
    print(f"   🔄 Total Packets Processed: {final_stats['packets_processed']}")
    print(f"   🚨 Total Threats Detected: {final_stats['threats_detected']}")
    print(f"   ⏱️ Average Packets/Second: {final_stats.get('packets_per_second', 0):.2f}")
    print(f"   🎯 Real-time Threat Alerts: {threat_count}")
    
    # Stop the engine
    ids_engine.stop()
    print("\n✅ Enhanced test completed!")
    
    # Analysis and recommendations
    print(f"\n🔍 ANALYSIS:")
    if final_stats['packets_captured'] > 0:
        print(f"   ✅ SUCCESS: Network monitoring is working!")
        print(f"   📊 Captured {final_stats['packets_captured']} network packets")
        
        if final_stats['threats_detected'] > 0:
            print(f"   🛡️ SECURITY: Detected {final_stats['threats_detected']} potential threats")
            print(f"   🎯 Detection rate: {(final_stats['threats_detected']/final_stats['packets_captured']*100):.1f}%")
        else:
            print(f"   🟢 CLEAN: No threats detected in captured traffic")
            
        print(f"\n💡 This demonstrates REAL IDS/IPS capabilities:")
        print(f"   • Real packet capture from network interface")
        print(f"   • Live threat analysis of network traffic")  
        print(f"   • Persistent threat storage in database")
        
    else:
        print(f"   ⚠️ No network packets were captured")
        print(f"   🔧 Possible issues:")
        print(f"      • No network activity during test")
        print(f"      • Insufficient permissions for packet capture")
        print(f"      • Network interface not active")
        print(f"   💡 Try: sudo python3 enhanced_test_real_ids.py")

if __name__ == "__main__":
    import os
    
    print("🔒 Checking permissions...")
    if os.geteuid() != 0:
        print("⚠️ WARNING: Not running as root.")
        print("💡 For best results, run with: sudo python3 enhanced_test_real_ids.py")
        print("🚀 Continuing anyway...\n")
    else:
        print("✅ Running with root privileges - full packet capture enabled\n")
    
    enhanced_network_test()
