# IDS/IPS Installation and Deployment Guide

**Version:** 1.0.0  
**Date:** August 8, 2025  
**Author:** Manus AI  
**Document Type:** Installation and Deployment Guide

---

## Table of Contents

1. [Prerequisites and System Requirements](#prerequisites-and-system-requirements)
2. [Installation Methods](#installation-methods)
3. [Quick Start Installation](#quick-start-installation)
4. [Advanced Installation](#advanced-installation)
5. [Configuration](#configuration)
6. [Deployment Scenarios](#deployment-scenarios)
7. [Network Configuration](#network-configuration)
8. [Security Hardening](#security-hardening)
9. [Performance Tuning](#performance-tuning)
10. [Troubleshooting](#troubleshooting)
11. [Maintenance and Updates](#maintenance-and-updates)

---

## Prerequisites and System Requirements

### Minimum System Requirements

The IDS/IPS system requires adequate hardware resources to ensure optimal performance and reliable threat detection capabilities. The following specifications represent minimum requirements for basic deployment scenarios:

**Hardware Requirements:**
- **CPU:** Quad-core processor (Intel Core i5 or AMD Ryzen 5 equivalent)
- **Memory:** 8 GB RAM minimum, 16 GB recommended
- **Storage:** 100 GB available disk space for system and logs
- **Network:** Gigabit Ethernet interface for monitoring
- **Additional Storage:** 500 GB recommended for extended log retention

**Recommended System Requirements:**
- **CPU:** 8-core processor (Intel Core i7/i9 or AMD Ryzen 7/9)
- **Memory:** 32 GB RAM for high-traffic environments
- **Storage:** 500 GB SSD for system and active logs
- **Network:** Multiple gigabit interfaces for comprehensive monitoring
- **Archive Storage:** 2+ TB for long-term log retention and forensics

### Operating System Support

The system supports multiple Linux distributions with preference for long-term support versions that provide stability and security updates:

**Supported Operating Systems:**
- **Ubuntu 20.04 LTS or later** (Recommended)
- **CentOS 8 or later / Rocky Linux 8+**
- **Red Hat Enterprise Linux 8+**
- **Debian 10 or later**
- **SUSE Linux Enterprise Server 15+**

**Required System Components:**
- **Python 3.8 or later** with development headers
- **Node.js 16.0 or later** for dashboard components
- **Docker 20.10 or later** (for containerized deployment)
- **Git** for source code management
- **Build tools** (gcc, make, cmake)

### Network Requirements

Network configuration plays a critical role in IDS/IPS effectiveness and requires careful planning to ensure comprehensive monitoring coverage:

**Network Access Requirements:**
- **Monitoring Interfaces:** Access to network segments requiring protection
- **Management Interface:** Dedicated interface for administrative access
- **Internet Access:** For threat intelligence updates and system updates
- **Time Synchronization:** NTP access for accurate timestamping

**Port Requirements:**
- **TCP 5000:** API server (configurable)
- **TCP 5173:** Dashboard interface (configurable)
- **TCP 22:** SSH administrative access
- **UDP 123:** NTP time synchronization
- **TCP 514/UDP 514:** Syslog integration (optional)

### Software Dependencies

The system requires various software packages and libraries that must be installed before deployment:

**Python Dependencies:**
```bash
# Core processing libraries
numpy>=1.21.0
pandas>=1.3.0
scikit-learn>=1.0.0
scipy>=1.7.0

# Network and security libraries
scapy>=2.4.5
cryptography>=3.4.0
requests>=2.25.0

# Database and logging
sqlite3 (built-in)
psycopg2-binary>=2.9.0 (for PostgreSQL)

# Web framework
flask>=2.0.0
flask-cors>=3.0.0
```

**System Packages (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y python3-dev python3-pip nodejs npm
sudo apt install -y build-essential cmake git
sudo apt install -y libpcap-dev tcpdump
sudo apt install -y postgresql-client-common (optional)
```

**System Packages (CentOS/RHEL):**
```bash
sudo yum update
sudo yum install -y python3-devel python3-pip nodejs npm
sudo yum install -y gcc gcc-c++ make cmake git
sudo yum install -y libpcap-devel tcpdump
sudo yum groupinstall -y "Development Tools"
```

---

## Installation Methods

### Method 1: Automated Installation Script

The automated installation script provides the fastest deployment method for standard configurations:

```bash
#!/bin/bash
# IDS/IPS Automated Installation Script

# Download and run installation script
curl -fsSL https://raw.githubusercontent.com/your-repo/ids-ips/main/install.sh | bash

# Or download and inspect before running
wget https://raw.githubusercontent.com/your-repo/ids-ips/main/install.sh
chmod +x install.sh
./install.sh
```

The automated script performs the following actions:
1. Verifies system requirements and dependencies
2. Downloads and installs all required packages
3. Creates system users and directories
4. Configures basic system settings
5. Starts core services
6. Provides post-installation configuration guidance

### Method 2: Manual Installation

Manual installation provides complete control over the deployment process and enables customization for specific requirements:

**Step 1: System Preparation**
```bash
# Create system user for IDS/IPS
sudo useradd -r -s /bin/false idsips
sudo mkdir -p /opt/idsips
sudo chown idsips:idsips /opt/idsips

# Create log directories
sudo mkdir -p /var/log/idsips
sudo chown idsips:idsips /var/log/idsips

# Create configuration directory
sudo mkdir -p /etc/idsips
sudo chown idsips:idsips /etc/idsips
```

**Step 2: Source Code Installation**
```bash
# Clone repository
cd /opt/idsips
sudo -u idsips git clone https://github.com/your-repo/ids-ips.git .

# Install Python dependencies
sudo -u idsips python3 -m venv venv
sudo -u idsips ./venv/bin/pip install -r requirements.txt

# Install Node.js dependencies for dashboard
cd ids_ips_dashboard
sudo -u idsips npm install
sudo -u idsips npm run build
```

**Step 3: Database Setup**
```bash
# Initialize SQLite database (default)
sudo -u idsips python3 -c "
from logging_system.logger import IDSLogger
logger = IDSLogger({'log_directory': '/var/log/idsips'})
logger.initialize_database()
"

# Or configure PostgreSQL (advanced)
sudo -u postgres createdb idsips
sudo -u postgres createuser idsips
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE idsips TO idsips;"
```

### Method 3: Container Deployment

Container deployment provides isolation, portability, and simplified management:

**Docker Compose Deployment:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  idsips-api:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./config:/etc/idsips
      - ./logs:/var/log/idsips
    environment:
      - IDSIPS_CONFIG=/etc/idsips/config.json
    networks:
      - idsips-network
    
  idsips-dashboard:
    build: ./ids_ips_dashboard
    ports:
      - "5173:5173"
    depends_on:
      - idsips-api
    networks:
      - idsips-network
    
  idsips-database:
    image: postgres:13
    environment:
      - POSTGRES_DB=idsips
      - POSTGRES_USER=idsips
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - idsips-network

networks:
  idsips-network:
    driver: bridge

volumes:
  postgres_data:
```

**Container Deployment Commands:**
```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Scale processing containers
docker-compose up -d --scale idsips-api=3

# Stop and remove containers
docker-compose down
```

---

## Quick Start Installation

For rapid deployment and testing, follow these streamlined installation steps:

### Ubuntu/Debian Quick Start

```bash
# 1. Update system and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nodejs npm git

# 2. Clone repository
git clone https://github.com/your-repo/ids-ips.git
cd ids-ips

# 3. Install Python dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Install dashboard dependencies
cd ids_ips_dashboard
npm install
npm run build
cd ..

# 5. Create basic configuration
cp config/config.example.json config/config.json

# 6. Initialize database
python3 -c "
from logging_system.logger import IDSLogger
logger = IDSLogger({'log_directory': './logs'})
logger.initialize_database()
"

# 7. Start services
python3 ids_ips_backend/src/api_server.py &
cd ids_ips_dashboard && npm run dev &

# 8. Access dashboard
echo "Dashboard available at: http://localhost:5173"
echo "API available at: http://localhost:5000"
```

### CentOS/RHEL Quick Start

```bash
# 1. Update system and install dependencies
sudo yum update -y
sudo yum install -y python3 python3-pip nodejs npm git

# 2. Follow steps 2-8 from Ubuntu installation above
```

### Verification Steps

After installation, verify system functionality:

```bash
# Check API server status
curl http://localhost:5000/api/health

# Check dashboard accessibility
curl http://localhost:5173

# Verify database connectivity
python3 -c "
from logging_system.logger import IDSLogger
logger = IDSLogger({'log_directory': './logs'})
print('Database connection: OK')
"

# Test detection engine
python3 detection_engine/enhanced_detector.py
```

---

## Advanced Installation

### High-Availability Deployment

High-availability deployment ensures continuous operation through redundancy and failover mechanisms:

**Load Balancer Configuration (HAProxy):**
```
# /etc/haproxy/haproxy.cfg
global
    daemon
    maxconn 4096

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend idsips_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/idsips.pem
    redirect scheme https if !{ ssl_fc }
    default_backend idsips_backend

backend idsips_backend
    balance roundrobin
    option httpchk GET /api/health
    server idsips1 10.0.1.10:5000 check
    server idsips2 10.0.1.11:5000 check
    server idsips3 10.0.1.12:5000 check
```

**Database Clustering (PostgreSQL):**
```bash
# Primary database server
sudo -u postgres initdb -D /var/lib/postgresql/data
echo "wal_level = replica" >> /var/lib/postgresql/data/postgresql.conf
echo "max_wal_senders = 3" >> /var/lib/postgresql/data/postgresql.conf
echo "host replication idsips 10.0.1.0/24 md5" >> /var/lib/postgresql/data/pg_hba.conf

# Replica database servers
sudo -u postgres pg_basebackup -h 10.0.1.10 -D /var/lib/postgresql/data -U idsips -W
echo "standby_mode = 'on'" >> /var/lib/postgresql/data/recovery.conf
echo "primary_conninfo = 'host=10.0.1.10 port=5432 user=idsips'" >> /var/lib/postgresql/data/recovery.conf
```

### Distributed Deployment

Distributed deployment scales processing across multiple nodes:

**Processing Node Configuration:**
```json
{
  "node_type": "processor",
  "node_id": "processor-01",
  "cluster": {
    "coordinator": "10.0.1.100:6379",
    "nodes": [
      "10.0.1.101:5000",
      "10.0.1.102:5000",
      "10.0.1.103:5000"
    ]
  },
  "processing": {
    "packet_capture": true,
    "threat_detection": true,
    "prevention": false
  }
}
```

**Coordinator Node Configuration:**
```json
{
  "node_type": "coordinator",
  "node_id": "coordinator-01",
  "services": {
    "load_balancing": true,
    "threat_correlation": true,
    "central_logging": true,
    "management_api": true
  },
  "database": {
    "type": "postgresql",
    "host": "10.0.1.200",
    "database": "idsips_cluster"
  }
}
```

### Cloud Deployment

Cloud deployment leverages managed services for scalability and reliability:

**AWS Deployment (Terraform):**
```hcl
# main.tf
provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "idsips_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "idsips-vpc"
  }
}

resource "aws_subnet" "idsips_subnet" {
  count             = 2
  vpc_id            = aws_vpc.idsips_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "idsips-subnet-${count.index + 1}"
  }
}

resource "aws_launch_template" "idsips_template" {
  name_prefix   = "idsips-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = "t3.large"
  
  vpc_security_group_ids = [aws_security_group.idsips_sg.id]
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    config = jsonencode(var.idsips_config)
  }))
}

resource "aws_autoscaling_group" "idsips_asg" {
  name                = "idsips-asg"
  vpc_zone_identifier = aws_subnet.idsips_subnet[*].id
  target_group_arns   = [aws_lb_target_group.idsips_tg.arn]
  health_check_type   = "ELB"
  
  min_size         = 2
  max_size         = 10
  desired_capacity = 3
  
  launch_template {
    id      = aws_launch_template.idsips_template.id
    version = "$Latest"
  }
}
```

**Kubernetes Deployment:**
```yaml
# kubernetes-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: idsips-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: idsips-api
  template:
    metadata:
      labels:
        app: idsips-api
    spec:
      containers:
      - name: idsips-api
        image: idsips/api:latest
        ports:
        - containerPort: 5000
        env:
        - name: IDSIPS_CONFIG
          valueFrom:
            configMapKeyRef:
              name: idsips-config
              key: config.json
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: idsips-api-service
spec:
  selector:
    app: idsips-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

---

## Configuration

### Basic Configuration

The system uses JSON configuration files for all settings:

**Main Configuration File (/etc/idsips/config.json):**
```json
{
  "system": {
    "name": "IDS/IPS Production",
    "version": "1.0.0",
    "debug": false,
    "log_level": "INFO"
  },
  "network": {
    "interfaces": ["eth0", "eth1"],
    "capture_buffer_size": 65536,
    "promiscuous_mode": true,
    "packet_timeout": 1000
  },
  "detection": {
    "signature_enabled": true,
    "anomaly_enabled": true,
    "ml_enabled": true,
    "behavioral_enabled": true,
    "threat_intel_enabled": true,
    "confidence_threshold": 0.7,
    "max_workers": 8
  },
  "prevention": {
    "auto_blocking": true,
    "block_duration": 3600,
    "whitelist": [
      "127.0.0.1",
      "::1",
      "192.168.1.0/24"
    ],
    "block_threshold": 0.8
  },
  "logging": {
    "log_directory": "/var/log/idsips",
    "max_log_size": 104857600,
    "retention_days": 30,
    "enable_syslog": true,
    "syslog_server": "10.0.1.100:514",
    "enable_database": true,
    "database_url": "sqlite:///var/log/idsips/idsips.db"
  },
  "alerting": {
    "email_enabled": true,
    "email_server": "smtp.company.com:587",
    "email_username": "idsips@company.com",
    "email_password": "secure_password",
    "email_recipients": ["security@company.com"],
    "webhook_enabled": true,
    "webhook_url": "https://hooks.company.com/idsips",
    "severity_threshold": "MEDIUM"
  },
  "api": {
    "host": "0.0.0.0",
    "port": 5000,
    "ssl_enabled": true,
    "ssl_cert": "/etc/ssl/certs/idsips.crt",
    "ssl_key": "/etc/ssl/private/idsips.key",
    "api_key_required": true,
    "rate_limit": 1000
  },
  "dashboard": {
    "host": "0.0.0.0",
    "port": 5173,
    "ssl_enabled": true,
    "session_timeout": 3600,
    "max_sessions": 100
  }
}
```

### Advanced Configuration Options

**Detection Engine Tuning:**
```json
{
  "detection_advanced": {
    "signature_detection": {
      "signature_file": "/etc/idsips/signatures.json",
      "update_interval": 3600,
      "max_pattern_length": 1024,
      "case_sensitive": false
    },
    "anomaly_detection": {
      "threshold": 3.0,
      "window_size": 1000,
      "learning_rate": 0.01,
      "min_samples": 100,
      "adaptation_rate": 0.1
    },
    "ml_detection": {
      "model_path": "/var/lib/idsips/models",
      "confidence_threshold": 0.7,
      "retrain_interval": 86400,
      "feature_selection": "auto",
      "algorithm": "random_forest"
    },
    "behavioral_detection": {
      "session_timeout": 300,
      "pattern_window": 3600,
      "correlation_threshold": 0.8,
      "max_sessions": 10000
    }
  }
}
```

**Performance Optimization:**
```json
{
  "performance": {
    "packet_processing": {
      "max_workers": 8,
      "queue_size": 10000,
      "batch_size": 100,
      "processing_timeout": 1.0
    },
    "memory_management": {
      "max_memory_usage": "4GB",
      "garbage_collection": "auto",
      "cache_size": "1GB"
    },
    "cpu_optimization": {
      "cpu_affinity": [0, 1, 2, 3],
      "thread_priority": "high",
      "numa_aware": true
    }
  }
}
```

### Environment-Specific Configuration

**Development Environment:**
```json
{
  "system": {
    "debug": true,
    "log_level": "DEBUG"
  },
  "detection": {
    "confidence_threshold": 0.5,
    "max_workers": 2
  },
  "logging": {
    "retention_days": 7,
    "enable_syslog": false
  },
  "api": {
    "ssl_enabled": false,
    "api_key_required": false
  }
}
```

**Production Environment:**
```json
{
  "system": {
    "debug": false,
    "log_level": "WARNING"
  },
  "detection": {
    "confidence_threshold": 0.8,
    "max_workers": 16
  },
  "logging": {
    "retention_days": 90,
    "enable_syslog": true,
    "enable_database": true
  },
  "api": {
    "ssl_enabled": true,
    "api_key_required": true,
    "rate_limit": 100
  },
  "security": {
    "encryption_enabled": true,
    "audit_logging": true,
    "access_control": "strict"
  }
}
```

