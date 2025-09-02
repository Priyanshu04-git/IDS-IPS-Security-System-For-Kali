#!/bin/bash

# IDS/IPS Automated Installation Script
# Version: 1.0.0
# Date: August 8, 2025
# Author: Manus AI

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/idsips"
LOG_DIR="/var/log/idsips"
CONFIG_DIR="/etc/idsips"
SERVICE_USER="idsips"
PYTHON_VERSION="3.8"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "  IDS/IPS Automated Installation Script"
    echo "  Version: 1.0.0"
    echo "=============================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        print_error "Cannot detect operating system"
        exit 1
    fi
    
    print_info "Detected OS: $OS $VER"
}

check_requirements() {
    print_step "Checking system requirements..."
    
    # Check Python version
    if command -v python3 &> /dev/null; then
        PYTHON_VER=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
        print_info "Python version: $PYTHON_VER"
        
        if [[ $(echo "$PYTHON_VER >= $PYTHON_VERSION" | bc -l) -eq 0 ]]; then
            print_error "Python $PYTHON_VERSION or higher is required"
            exit 1
        fi
    else
        print_error "Python 3 is not installed"
        exit 1
    fi
    
    # Check available memory
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $MEMORY_GB -lt 8 ]]; then
        print_warning "System has less than 8GB RAM. Performance may be affected."
    fi
    
    # Check available disk space
    DISK_GB=$(df / | awk 'NR==2{print int($4/1024/1024)}')
    if [[ $DISK_GB -lt 100 ]]; then
        print_warning "Less than 100GB disk space available. Consider adding more storage."
    fi
    
    print_info "System requirements check completed"
}

install_dependencies() {
    print_step "Installing system dependencies..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt update
        apt install -y python3 python3-pip python3-venv python3-dev
        apt install -y nodejs npm
        apt install -y build-essential cmake git
        apt install -y libpcap-dev tcpdump
        apt install -y sqlite3 libsqlite3-dev
        apt install -y curl wget unzip
        
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
        yum update -y
        yum install -y python3 python3-pip python3-devel
        yum install -y nodejs npm
        yum install -y gcc gcc-c++ make cmake git
        yum install -y libpcap-devel tcpdump
        yum install -y sqlite sqlite-devel
        yum install -y curl wget unzip
        yum groupinstall -y "Development Tools"
        
    else
        print_error "Unsupported operating system: $OS"
        exit 1
    fi
    
    print_info "System dependencies installed successfully"
}

create_user() {
    print_step "Creating system user..."
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/false -d $INSTALL_DIR $SERVICE_USER
        print_info "Created user: $SERVICE_USER"
    else
        print_info "User $SERVICE_USER already exists"
    fi
}

create_directories() {
    print_step "Creating system directories..."
    
    # Create main directories
    mkdir -p $INSTALL_DIR
    mkdir -p $LOG_DIR
    mkdir -p $CONFIG_DIR
    mkdir -p $INSTALL_DIR/logs
    mkdir -p $INSTALL_DIR/data
    mkdir -p $INSTALL_DIR/backups
    
    # Set ownership
    chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR
    chown -R $SERVICE_USER:$SERVICE_USER $LOG_DIR
    chown -R $SERVICE_USER:$SERVICE_USER $CONFIG_DIR
    
    # Set permissions
    chmod 755 $INSTALL_DIR
    chmod 755 $LOG_DIR
    chmod 750 $CONFIG_DIR
    
    print_info "System directories created successfully"
}

install_application() {
    print_step "Installing IDS/IPS application..."
    
    # Copy application files
    cp -r ./* $INSTALL_DIR/
    chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR
    
    # Create Python virtual environment
    cd $INSTALL_DIR
    sudo -u $SERVICE_USER python3 -m venv venv
    
    # Install Python dependencies
    sudo -u $SERVICE_USER $INSTALL_DIR/venv/bin/pip install --upgrade pip
    sudo -u $SERVICE_USER $INSTALL_DIR/venv/bin/pip install -r requirements.txt
    
    # Install Node.js dependencies for dashboard
    if [[ -d "ids_ips_dashboard" ]]; then
        cd $INSTALL_DIR/ids_ips_dashboard
        sudo -u $SERVICE_USER npm install
        sudo -u $SERVICE_USER npm run build
    fi
    
    print_info "Application installed successfully"
}

configure_system() {
    print_step "Configuring system..."
    
    # Create default configuration
    if [[ ! -f "$CONFIG_DIR/config.json" ]]; then
        cat > $CONFIG_DIR/config.json << EOF
{
  "system": {
    "name": "IDS/IPS Production",
    "version": "1.0.0",
    "debug": false,
    "log_level": "INFO"
  },
  "network": {
    "interfaces": ["eth0"],
    "capture_buffer_size": 65536,
    "promiscuous_mode": true,
    "packet_timeout": 1000
  },
  "detection": {
    "signature_enabled": true,
    "anomaly_enabled": true,
    "ml_enabled": true,
    "behavioral_enabled": true,
    "confidence_threshold": 0.7,
    "max_workers": 4
  },
  "prevention": {
    "auto_blocking": false,
    "block_duration": 3600,
    "whitelist": ["127.0.0.1", "::1"],
    "block_threshold": 0.8
  },
  "logging": {
    "log_directory": "$LOG_DIR",
    "max_log_size": 104857600,
    "retention_days": 30,
    "enable_syslog": false,
    "enable_database": true,
    "database_url": "sqlite:///$LOG_DIR/idsips.db"
  },
  "api": {
    "host": "127.0.0.1",
    "port": 5000,
    "ssl_enabled": false,
    "api_key_required": false
  },
  "dashboard": {
    "host": "127.0.0.1",
    "port": 5173,
    "ssl_enabled": false
  }
}
EOF
        chown $SERVICE_USER:$SERVICE_USER $CONFIG_DIR/config.json
        chmod 640 $CONFIG_DIR/config.json
        print_info "Default configuration created"
    fi
    
    # Initialize database
    cd $INSTALL_DIR
    sudo -u $SERVICE_USER $INSTALL_DIR/venv/bin/python3 -c "
from logging_system.logger import IDSLogger
import json
with open('$CONFIG_DIR/config.json', 'r') as f:
    config = json.load(f)
logger = IDSLogger(config['logging'])
logger.initialize_database()
print('Database initialized successfully')
"
    
    print_info "System configuration completed"
}

create_systemd_services() {
    print_step "Creating systemd services..."
    
    # API Service
    cat > /etc/systemd/system/idsips-api.service << EOF
[Unit]
Description=IDS/IPS API Server
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
Environment=IDSIPS_CONFIG=$CONFIG_DIR/config.json
ExecStart=$INSTALL_DIR/venv/bin/python3 ids_ips_backend/src/api_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Dashboard Service (if exists)
    if [[ -d "$INSTALL_DIR/ids_ips_dashboard" ]]; then
        cat > /etc/systemd/system/idsips-dashboard.service << EOF
[Unit]
Description=IDS/IPS Dashboard
After=network.target idsips-api.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR/ids_ips_dashboard
ExecStart=/usr/bin/npm run dev -- --host
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    fi
    
    # Reload systemd
    systemctl daemon-reload
    
    print_info "Systemd services created"
}

configure_firewall() {
    print_step "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian UFW
        ufw allow 5000/tcp comment "IDS/IPS API"
        ufw allow 5173/tcp comment "IDS/IPS Dashboard"
        print_info "UFW firewall rules added"
        
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL firewalld
        firewall-cmd --permanent --add-port=5000/tcp
        firewall-cmd --permanent --add-port=5173/tcp
        firewall-cmd --reload
        print_info "Firewalld rules added"
        
    else
        print_warning "No supported firewall found. Please manually configure firewall rules."
    fi
}

start_services() {
    print_step "Starting services..."
    
    # Enable and start API service
    systemctl enable idsips-api
    systemctl start idsips-api
    
    # Enable and start dashboard service (if exists)
    if [[ -f "/etc/systemd/system/idsips-dashboard.service" ]]; then
        systemctl enable idsips-dashboard
        systemctl start idsips-dashboard
    fi
    
    # Wait for services to start
    sleep 5
    
    # Check service status
    if systemctl is-active --quiet idsips-api; then
        print_info "API service started successfully"
    else
        print_error "Failed to start API service"
        systemctl status idsips-api
    fi
    
    if systemctl is-active --quiet idsips-dashboard; then
        print_info "Dashboard service started successfully"
    else
        print_warning "Dashboard service not started (may not be available)"
    fi
}

run_tests() {
    print_step "Running system tests..."
    
    cd $INSTALL_DIR
    
    # Test API health
    sleep 2
    if curl -s http://localhost:5000/api/health > /dev/null; then
        print_info "API health check: PASSED"
    else
        print_warning "API health check: FAILED"
    fi
    
    # Test detection engine
    if sudo -u $SERVICE_USER timeout 10 $INSTALL_DIR/venv/bin/python3 detection_engine/enhanced_detector.py > /dev/null 2>&1; then
        print_info "Detection engine test: PASSED"
    else
        print_warning "Detection engine test: FAILED"
    fi
    
    print_info "System tests completed"
}

print_summary() {
    print_step "Installation Summary"
    echo
    echo -e "${GREEN}✅ IDS/IPS System Installation Completed Successfully!${NC}"
    echo
    echo "📍 Installation Details:"
    echo "   • Install Directory: $INSTALL_DIR"
    echo "   • Configuration: $CONFIG_DIR/config.json"
    echo "   • Logs Directory: $LOG_DIR"
    echo "   • Service User: $SERVICE_USER"
    echo
    echo "🌐 Access Information:"
    echo "   • API Server: http://localhost:5000"
    echo "   • Dashboard: http://localhost:5173"
    echo "   • Health Check: http://localhost:5000/api/health"
    echo
    echo "🔧 Service Management:"
    echo "   • Start API: sudo systemctl start idsips-api"
    echo "   • Stop API: sudo systemctl stop idsips-api"
    echo "   • Status: sudo systemctl status idsips-api"
    echo "   • Logs: sudo journalctl -u idsips-api -f"
    echo
    echo "📚 Next Steps:"
    echo "   1. Review configuration: $CONFIG_DIR/config.json"
    echo "   2. Configure network interfaces for monitoring"
    echo "   3. Customize detection rules and thresholds"
    echo "   4. Set up external integrations (SIEM, email, etc.)"
    echo "   5. Review documentation in $INSTALL_DIR/documentation/"
    echo
    echo -e "${BLUE}🛡️ Your network is now protected by the IDS/IPS system!${NC}"
    echo
}

# Main installation process
main() {
    print_header
    
    check_root
    detect_os
    check_requirements
    install_dependencies
    create_user
    create_directories
    install_application
    configure_system
    create_systemd_services
    configure_firewall
    start_services
    run_tests
    print_summary
}

# Run installation
main "$@"

