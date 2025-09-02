#!/usr/bin/env python3
"""
Real-time IDS/IPS Engine
Integrates packet capture with detection engines for actual threat detection
"""

import sys
import threading
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Callable
import json
import queue

# Add paths for imports
sys.path.append(str(Path(__file__).parent))

try:
    from packet_capture.packet_sniffer import PacketSniffer, PacketInfo
    from detection_engine.signature_detector import SignatureDetector, DetectionResult
    from detection_engine.anomaly_detector import AnomalyDetector
    from detection_engine.ml_detector import MLDetector
    from logging_system.logger import SecurityLogger
    from simple_detector import SimpleRealDetector
    COMPONENTS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Some components not available: {e}")
    print("Will use simplified detection")
    try:
        from simple_detector import SimpleRealDetector
        COMPONENTS_AVAILABLE = True
    except ImportError:
        COMPONENTS_AVAILABLE = False

class RealIDSEngine:
    """
    Real-time IDS/IPS Engine that performs actual network monitoring and threat detection
    """
    
    def __init__(self, interface: str = None, db_manager=None):
        """
        Initialize the real IDS engine
        
        Args:
            interface: Network interface to monitor (None for auto-detect)
            db_manager: Database manager for storing threats
        """
        # Setup logging first
        self.logger = self._setup_logging()
        
        self.interface = interface or self._detect_interface()
        self.db_manager = db_manager
        self.running = False
        
        # Initialize components
        self.packet_queue = queue.Queue(maxsize=1000)
        self.threat_queue = queue.Queue(maxsize=100)
        
        # Detection engines
        self.signature_detector = None
        self.anomaly_detector = None
        self.ml_detector = None
        
        # Packet sniffer
        self.packet_sniffer = None
        
        # Statistics
        self.stats = {
            'packets_captured': 0,
            'packets_processed': 0,
            'threats_detected': 0,
            'false_positives': 0,
            'start_time': None,
            'last_packet_time': None
        }
        
        # Initialize detection engines
        self._initialize_detection_engines()
        
        # Initialize packet sniffer
        self._initialize_packet_sniffer()
        
    def _detect_interface(self) -> str:
        """Auto-detect best network interface"""
        import psutil
        
        interfaces = psutil.net_if_addrs()
        
        # Prefer non-loopback interfaces
        for interface_name, addresses in interfaces.items():
            if interface_name != 'lo':  # Skip loopback
                for addr in addresses:
                    if addr.family == 2:  # IPv4
                        if not addr.address.startswith('127.'):
                            self.logger.info(f"Selected network interface: {interface_name}")
                            return interface_name
        
        # Fallback to first available
        available = list(interfaces.keys())
        selected = available[0] if available else 'eth0'
        self.logger.warning(f"Using fallback interface: {selected}")
        return selected
    
    def _setup_logging(self) -> logging.Logger:
        """Setup logging for the IDS engine"""
        logger = logging.getLogger('RealIDSEngine')
        logger.setLevel(logging.INFO)
        
        # Create handler if not exists
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def _initialize_detection_engines(self):
        """Initialize all detection engines"""
        try:
            # Always initialize simple detector
            self.simple_detector = SimpleRealDetector()
            self.logger.info("✅ Simple real detector initialized")
            
            # Try to initialize advanced detectors
            try:
                self.signature_detector = SignatureDetector()
                self.logger.info("✅ Signature detector initialized")
            except Exception as e:
                self.logger.warning(f"⚠️ Signature detector failed: {e}")
                self.signature_detector = None
            
            try:
                self.anomaly_detector = AnomalyDetector()
                self.logger.info("✅ Anomaly detector initialized")
            except Exception as e:
                self.logger.warning(f"⚠️ Anomaly detector failed: {e}")
                self.anomaly_detector = None
            
            try:
                self.ml_detector = MLDetector()
                self.logger.info("✅ ML detector initialized")
            except Exception as e:
                self.logger.warning(f"⚠️ ML detector failed: {e}")
                self.ml_detector = None
                
        except Exception as e:
            self.logger.error(f"❌ Error initializing detection engines: {e}")
    
    def _initialize_packet_sniffer(self):
        """Initialize packet sniffer"""
        try:
            if COMPONENTS_AVAILABLE:
                self.packet_sniffer = PacketSniffer(
                    interface=self.interface,
                    filter_expression="ip"  # Monitor IP traffic only
                )
                
                # Add packet processing callback
                self.packet_sniffer.add_callback(self._process_packet)
                self.logger.info(f"✅ Packet sniffer initialized on interface: {self.interface}")
            else:
                self.logger.warning("⚠️ Packet sniffer not available - components missing")
                
        except Exception as e:
            self.logger.error(f"❌ Error initializing packet sniffer: {e}")
    
    def _process_packet(self, packet_info: PacketInfo):
        """Process captured packet through detection engines"""
        try:
            self.stats['packets_captured'] += 1
            self.stats['last_packet_time'] = datetime.now()
            
            # Add to processing queue (non-blocking)
            try:
                self.packet_queue.put_nowait(packet_info)
            except queue.Full:
                self.logger.warning("Packet queue full - dropping packet")
            
        except Exception as e:
            self.logger.error(f"Error processing packet: {e}")
    
    def _packet_processor_thread(self):
        """Background thread to process packets from queue"""
        while self.running:
            try:
                # Get packet from queue (with timeout)
                packet_info = self.packet_queue.get(timeout=1.0)
                
                self.stats['packets_processed'] += 1
                
                # Run through all detection engines
                threats = []
                
                # Simple detector (always runs)
                if hasattr(self, 'simple_detector') and self.simple_detector:
                    simple_results = self.simple_detector.analyze_packet(packet_info)
                    threats.extend(simple_results)
                
                # Advanced signature detection
                if self.signature_detector:
                    try:
                        sig_results = self.signature_detector.analyze_packet(packet_info)
                        threats.extend(sig_results)
                    except Exception as e:
                        self.logger.warning(f"Signature detection error: {e}")
                
                # Anomaly detection
                if self.anomaly_detector:
                    try:
                        anom_results = self.anomaly_detector.analyze_packet(packet_info)
                        threats.extend(anom_results)
                    except Exception as e:
                        self.logger.warning(f"Anomaly detection error: {e}")
                
                # ML detection
                if self.ml_detector:
                    try:
                        ml_results = self.ml_detector.analyze_packet(packet_info)
                        threats.extend(ml_results)
                    except Exception as e:
                        self.logger.warning(f"ML detection error: {e}")
                
                # Process any detected threats
                for threat in threats:
                    self._handle_threat_detection(threat, packet_info)
                
                self.packet_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                self.logger.error(f"Error in packet processor: {e}")
    
    def _handle_threat_detection(self, detection_result, packet_info: PacketInfo):
        """Handle a detected threat"""
        try:
            self.stats['threats_detected'] += 1
            
            # Create threat data structure
            threat_data = {
                'threat_id': f"REAL_{int(time.time() * 1000)}_{self.stats['threats_detected']}",
                'timestamp': datetime.now().isoformat(),
                'source_ip': packet_info.src_ip,
                'destination_ip': packet_info.dst_ip,
                'threat_type': getattr(detection_result, 'category', 'unknown').lower(),
                'severity': getattr(detection_result, 'severity', 'MEDIUM'),
                'confidence': getattr(detection_result, 'confidence', 0.8),
                'detection_method': 'Real-time Analysis',
                'description': getattr(detection_result, 'signature_name', 'Real threat detected'),
                'action_taken': 'logged',
                'blocked': 0,
                'country': 'Unknown',
                'city': 'Unknown',
                'port': packet_info.dst_port,
                'protocol': packet_info.protocol,
                'payload_snippet': getattr(detection_result, 'matched_content', 'N/A')[:100],
                'indicators': ['real_traffic', 'signature_match'],
                'metadata': {
                    'rule_id': getattr(detection_result, 'signature_id', 'REAL001'),
                    'packet_size': packet_info.packet_size,
                    'detection_engine': type(detection_result).__name__
                }
            }
            
            # Log the threat
            self.logger.warning(f"🚨 REAL THREAT DETECTED: {threat_data['threat_type']} from {threat_data['source_ip']}")
            
            # Save to database if available
            if self.db_manager:
                success = self.db_manager.save_threat(threat_data)
                if success:
                    self.logger.info(f"💾 Real threat saved to database")
            
            # Add to threat queue for real-time updates
            try:
                self.threat_queue.put_nowait(threat_data)
            except queue.Full:
                self.logger.warning("Threat queue full")
            
        except Exception as e:
            self.logger.error(f"Error handling threat detection: {e}")
    
    def start(self):
        """Start the real-time IDS engine"""
        if self.running:
            self.logger.warning("IDS engine already running")
            return False
        
        self.logger.info("🚀 Starting Real-time IDS Engine...")
        self.running = True
        self.stats['start_time'] = datetime.now()
        
        try:
            # Start packet processor thread
            self.processor_thread = threading.Thread(
                target=self._packet_processor_thread,
                daemon=True
            )
            self.processor_thread.start()
            self.logger.info("✅ Packet processor thread started")
            
            # Start packet capture
            if self.packet_sniffer:
                self.packet_sniffer.start()
                self.logger.info(f"✅ Packet capture started on {self.interface}")
            else:
                self.logger.warning("⚠️ Packet capture not available")
            
            self.logger.info("🔥 Real-time IDS Engine is now ACTIVE!")
            self.logger.info(f"🎯 Monitoring interface: {self.interface}")
            self.logger.info(f"🛡️ Detection engines: {len([x for x in [self.signature_detector, self.anomaly_detector, self.ml_detector] if x])}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Failed to start IDS engine: {e}")
            self.running = False
            return False
    
    def stop(self):
        """Stop the real-time IDS engine"""
        if not self.running:
            return
        
        self.logger.info("🛑 Stopping Real-time IDS Engine...")
        self.running = False
        
        # Stop packet capture
        if self.packet_sniffer:
            self.packet_sniffer.stop()
            self.logger.info("✅ Packet capture stopped")
        
        self.logger.info("✅ Real-time IDS Engine stopped")
    
    def get_stats(self) -> Dict:
        """Get current statistics"""
        stats = self.stats.copy()
        if stats['start_time']:
            uptime = datetime.now() - stats['start_time']
            stats['uptime_seconds'] = uptime.total_seconds()
            stats['packets_per_second'] = stats['packets_captured'] / max(1, uptime.total_seconds())
        
        return stats
    
    def get_recent_threats(self, limit: int = 10) -> List[Dict]:
        """Get recent threats from queue"""
        threats = []
        try:
            while len(threats) < limit:
                threat = self.threat_queue.get_nowait()
                threats.append(threat)
        except queue.Empty:
            pass
        
        return threats
    
    def is_running(self) -> bool:
        """Check if the engine is running"""
        return self.running


# Test function
def test_real_ids():
    """Test the real IDS engine"""
    print("🧪 Testing Real-time IDS Engine...")
    
    # Create engine
    engine = RealIDSEngine()
    
    # Start engine
    if engine.start():
        print("✅ Engine started successfully")
        
        # Run for a short time
        try:
            print("🔍 Monitoring network traffic for 30 seconds...")
            time.sleep(30)
            
            # Show stats
            stats = engine.get_stats()
            print(f"\n📊 Statistics after 30 seconds:")
            print(f"   Packets captured: {stats['packets_captured']}")
            print(f"   Packets processed: {stats['packets_processed']}")
            print(f"   Threats detected: {stats['threats_detected']}")
            print(f"   Packets/second: {stats.get('packets_per_second', 0):.2f}")
            
        except KeyboardInterrupt:
            print("\n⏹️ Test interrupted by user")
        finally:
            engine.stop()
            print("✅ Test completed")
    else:
        print("❌ Failed to start engine")


if __name__ == "__main__":
    test_real_ids()
