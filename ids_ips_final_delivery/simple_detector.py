#!/usr/bin/env python3
"""
Simple but effective threat detection patterns for real network traffic
"""

from detection_engine.signature_detector import Signature, DetectionResult
from typing import List
import re

class SimpleRealDetector:
    """
    Realistic threat detector that only flags genuinely suspicious network activity.
    Uses behavioral analysis and statistical thresholds to reduce false positives.
    """
    
    def __init__(self):
        self.signatures = self._load_realistic_signatures()
        self.detection_count = 0
    
    def _load_realistic_signatures(self) -> List[Signature]:
        """Load realistic threat detection signatures"""
        return [
            # Port Scanning Detection
            Signature(
                id="PORT_SCAN_001",
                name="Port Scan Detection",
                description="Multiple connection attempts to different ports",
                severity="MEDIUM",
                category="RECONNAISSANCE",
                pattern=r"SYN.*:(\d+).*SYN.*:(\d+).*SYN.*:(\d+)",
                pattern_type="REGEX",
                protocol="TCP"
            ),
            
            # DDoS Detection - High packet rate
            Signature(
                id="DDOS_001",
                name="DDoS Attack - High Packet Rate",
                description="Unusually high packet rate from single source",
                severity="CRITICAL",
                category="DDOS",
                pattern="",
                pattern_type="BEHAVIORAL",
                protocol="ANY"
            ),
            
            # SQL Injection in HTTP
            Signature(
                id="SQL_INJ_001",
                name="SQL Injection Attempt",
                description="SQL injection patterns in HTTP traffic",
                severity="HIGH",
                category="ATTACK",
                pattern=r"(union\s+select|or\s+1=1|\'\s*or\s*\'\s*=\s*\'|drop\s+table)",
                pattern_type="REGEX",
                protocol="TCP"
            ),
            
            # Malware Communication
            Signature(
                id="MALWARE_001",
                name="Suspicious Domain Communication",
                description="Communication with known malicious domains",
                severity="HIGH",
                category="MALWARE",
                pattern=r"(\.tk\.|\.ml\.|suspicious-domain\.com)",
                pattern_type="REGEX",
                protocol="TCP"
            ),
            
            # Brute Force SSH
            Signature(
                id="BRUTE_SSH_001",
                name="SSH Brute Force Attack",
                description="Multiple failed SSH login attempts",
                severity="HIGH",
                category="BRUTE_FORCE",
                pattern="SSH.*:22",
                pattern_type="STRING",
                protocol="TCP",
                dst_port=22
            ),
            
            # Suspicious HTTP User Agents
            Signature(
                id="HTTP_BOT_001",
                name="Suspicious HTTP Bot",
                description="Known malicious user agents",
                severity="MEDIUM",
                category="MALWARE",
                pattern=r"(sqlmap|nikto|nmap|masscan|zmap)",
                pattern_type="REGEX",
                protocol="TCP"
            )
        ]
    
    def analyze_packet(self, packet_info) -> List[DetectionResult]:
        """Analyze packet with simple but effective detection"""
        detections = []
        
        try:
            # Simple heuristic-based detection
            detection = self._simple_threat_detection(packet_info)
            if detection:
                detections.append(detection)
                
        except Exception as e:
            print(f"Error in packet analysis: {e}")
        
        return detections
    
    def _simple_threat_detection(self, packet_info) -> DetectionResult:
        """Realistic threat detection - only flag genuinely suspicious activity"""
        
        # Keep track of connection attempts for port scan detection
        if not hasattr(self, 'connection_tracker'):
            self.connection_tracker = {}
            self.packet_count = 0
        
        self.packet_count += 1
        src_ip = packet_info.src_ip
        
        # Track connections per source IP
        if src_ip not in self.connection_tracker:
            self.connection_tracker[src_ip] = {
                'ports': set(),
                'packet_count': 0,
                'large_packets': 0,
                'suspicious_ports': 0
            }
        
        tracker = self.connection_tracker[src_ip]
        tracker['packet_count'] += 1
        
        # Add destination port to tracking
        if packet_info.dst_port:
            tracker['ports'].add(packet_info.dst_port)
        
        # PORT SCAN DETECTION: Multiple ports from same IP (realistic threshold)
        if len(tracker['ports']) >= 5 and packet_info.protocol == "TCP":
            # Only flag if targeting common service ports (realistic scan)
            service_ports = {21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1433, 3389}
            scanned_services = tracker['ports'].intersection(service_ports)
            
            if len(scanned_services) >= 3:  # Scanning multiple services = suspicious
                self.detection_count += 1
                return DetectionResult(
                    signature_id="REALISTIC_001",
                    signature_name="Port Scan Detected",
                    severity="HIGH",
                    category="port_scan",
                    timestamp=packet_info.timestamp,
                    src_ip=packet_info.src_ip,
                    dst_ip=packet_info.dst_ip,
                    src_port=packet_info.src_port,
                    dst_port=packet_info.dst_port,
                    protocol=packet_info.protocol,
                    matched_content=f"Port scan detected: {len(tracker['ports'])} ports scanned, {len(scanned_services)} service ports",
                    confidence=0.9
                )
        
        # DDOS DETECTION: High packet rate from single source (realistic threshold)
        if tracker['packet_count'] > 100:  # More than 100 packets from same IP
            self.detection_count += 1
            return DetectionResult(
                signature_id="REALISTIC_002",
                signature_name="High Traffic Volume",
                severity="MEDIUM",
                category="ddos",
                timestamp=packet_info.timestamp,
                src_ip=packet_info.src_ip,
                dst_ip=packet_info.dst_ip,
                src_port=packet_info.src_port,
                dst_port=packet_info.dst_port,
                protocol=packet_info.protocol,
                matched_content=f"High packet volume: {tracker['packet_count']} packets from {src_ip}",
                confidence=0.8
            )
        
        # MALWARE DETECTION: Connections to very unusual ports (realistic)
        suspicious_ports = {1234, 2222, 4444, 5555, 6666, 9999, 31337, 54321}  # Known backdoor ports
        if packet_info.dst_port in suspicious_ports:
            tracker['suspicious_ports'] += 1
            self.detection_count += 1
            return DetectionResult(
                signature_id="REALISTIC_003",
                signature_name="Backdoor Port Communication",
                severity="CRITICAL",
                category="malware",
                timestamp=packet_info.timestamp,
                src_ip=packet_info.src_ip,
                dst_ip=packet_info.dst_ip,
                src_port=packet_info.src_port,
                dst_port=packet_info.dst_port,
                protocol=packet_info.protocol,
                matched_content=f"Communication with known backdoor port {packet_info.dst_port}",
                confidence=0.95
            )
        
        # BRUTE FORCE DETECTION: Multiple SSH connections
        if packet_info.dst_port == 22 and packet_info.protocol == "TCP":
            if not hasattr(tracker, 'ssh_attempts'):
                tracker['ssh_attempts'] = 0
            tracker['ssh_attempts'] += 1
            
            if tracker['ssh_attempts'] > 10:  # More than 10 SSH attempts = brute force
                self.detection_count += 1
                return DetectionResult(
                    signature_id="REALISTIC_004",
                    signature_name="SSH Brute Force Attack",
                    severity="HIGH",
                    category="brute_force",
                    timestamp=packet_info.timestamp,
                    src_ip=packet_info.src_ip,
                    dst_ip=packet_info.dst_ip,
                    src_port=packet_info.src_port,
                    dst_port=packet_info.dst_port,
                    protocol=packet_info.protocol,
                    matched_content=f"SSH brute force: {tracker['ssh_attempts']} attempts from {src_ip}",
                    confidence=0.9
                )
        
        # Clean up old tracking data periodically
        if self.packet_count % 1000 == 0:
            # Reset trackers for IPs with low activity to prevent memory bloat
            ips_to_remove = [ip for ip, data in self.connection_tracker.items() 
                           if data['packet_count'] < 5]
            for ip in ips_to_remove:
                del self.connection_tracker[ip]
        
        return None
