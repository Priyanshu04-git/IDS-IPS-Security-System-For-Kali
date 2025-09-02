import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Shield,
  Network,
  Bell,
  Database,
  Users,
  Lock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const SystemConfig = () => {
  const [config, setConfig] = useState({
    // Detection Settings
    signatureDetection: true,
    anomalyDetection: true,
    mlDetection: true,
    behavioralAnalysis: true,
    
    // Thresholds
    anomalyThreshold: 3.5,
    mlConfidenceThreshold: 0.8,
    threatScoreThreshold: 0.7,
    
    // Network Settings
    monitoredInterfaces: ['eth0', 'eth1'],
    captureBufferSize: 1024,
    maxPacketsPerSecond: 10000,
    
    // Blocking Settings
    autoBlocking: true,
    blockDuration: 3600,
    whitelistedIPs: ['127.0.0.1', '192.168.1.1'],
    
    // Alerting
    emailAlerts: true,
    smsAlerts: false,
    webhookAlerts: true,
    alertEmail: 'admin@company.com',
    webhookUrl: 'https://hooks.company.com/security',
    
    // Logging
    logLevel: 'INFO',
    logRetention: 30,
    enableSyslog: true,
    syslogServer: '192.168.1.10',
    
    // Performance
    maxCpuUsage: 80,
    maxMemoryUsage: 75,
    threadPoolSize: 8
  })

  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState(null)

  // Load configuration from backend on component mount
  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/config')
      if (response.ok) {
        const savedConfig = await response.json()
        console.log('Loaded configuration from backend:', savedConfig)
        
        // Map backend config structure to frontend structure
        const frontendConfig = {
          signatureDetection: savedConfig.detection?.signature_enabled ?? true,
          anomalyDetection: savedConfig.detection?.anomaly_enabled ?? true,
          mlDetection: savedConfig.detection?.ml_enabled ?? true,
          behavioralAnalysis: savedConfig.detection?.behavioral_enabled ?? true,
          anomalyThreshold: savedConfig.detection?.anomaly_threshold ?? 3.5,
          mlConfidenceThreshold: savedConfig.detection?.ml_confidence_threshold ?? 0.8,
          threatScoreThreshold: savedConfig.detection?.threat_score_threshold ?? 0.7,
          monitoredInterfaces: savedConfig.network?.interfaces ?? ['eth0'],
          captureBufferSize: savedConfig.network?.capture_buffer_size ?? 1024,
          maxPacketsPerSecond: savedConfig.network?.max_packets_per_second ?? 10000,
          autoBlocking: savedConfig.blocking?.auto_blocking ?? true,
          blockDuration: savedConfig.blocking?.block_duration ?? 3600,
          whitelistedIPs: savedConfig.blocking?.whitelist ?? ['127.0.0.1'],
          emailAlerts: savedConfig.alerting?.email_alerts ?? true,
          smsAlerts: savedConfig.alerting?.sms_alerts ?? false,
          webhookAlerts: savedConfig.alerting?.webhook_alerts ?? true,
          alertEmail: savedConfig.alerting?.alert_email ?? 'admin@company.com',
          webhookUrl: savedConfig.alerting?.webhook_url ?? 'https://hooks.company.com/security',
          logLevel: savedConfig.logging?.log_level ?? 'INFO',
          logRetention: savedConfig.logging?.log_retention_days ?? 30,
          enableSyslog: savedConfig.logging?.enable_syslog ?? true,
          syslogServer: savedConfig.logging?.syslog_server ?? '192.168.1.10',
          maxCpuUsage: savedConfig.performance?.max_cpu_usage ?? 80,
          maxMemoryUsage: savedConfig.performance?.max_memory_usage ?? 75,
          threadPoolSize: savedConfig.performance?.thread_pool_size ?? 8
        }
        
        setConfig(frontendConfig)
        setLastSaved(new Date().toLocaleString())
      }
    } catch (error) {
      console.error('Error loading configuration:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setUnsavedChanges(true)
  }

  const saveConfig = async () => {
    try {
      // Map frontend config structure to backend structure
      const backendConfig = {
        detection: {
          signature_enabled: config.signatureDetection,
          anomaly_enabled: config.anomalyDetection,
          ml_enabled: config.mlDetection,
          behavioral_enabled: config.behavioralAnalysis,
          anomaly_threshold: config.anomalyThreshold,
          ml_confidence_threshold: config.mlConfidenceThreshold,
          threat_score_threshold: config.threatScoreThreshold
        },
        network: {
          interfaces: config.monitoredInterfaces,
          capture_buffer_size: config.captureBufferSize,
          max_packets_per_second: config.maxPacketsPerSecond
        },
        blocking: {
          auto_blocking: config.autoBlocking,
          block_duration: config.blockDuration,
          whitelist: config.whitelistedIPs
        },
        alerting: {
          email_alerts: config.emailAlerts,
          sms_alerts: config.smsAlerts,
          webhook_alerts: config.webhookAlerts,
          alert_email: config.alertEmail,
          webhook_url: config.webhookUrl
        },
        logging: {
          log_level: config.logLevel,
          log_retention_days: config.logRetention,
          enable_syslog: config.enableSyslog,
          syslog_server: config.syslogServer
        },
        performance: {
          max_cpu_usage: config.maxCpuUsage,
          max_memory_usage: config.maxMemoryUsage,
          thread_pool_size: config.threadPoolSize
        }
      }
      
      console.log('Saving configuration:', backendConfig)
      
      const response = await fetch('http://localhost:5000/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendConfig)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Configuration saved successfully:', result)
        setUnsavedChanges(false)
        setLastSaved(new Date().toLocaleString())
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      alert('Failed to save configuration. Please try again.')
    }
  }

  const resetConfig = () => {
    loadConfiguration()  // Reload from backend
    setUnsavedChanges(false)
  }

  const ConfigSection = ({ title, description, children }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )

  const SettingRow = ({ label, description, children }) => (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex-1">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading configuration...</span>
        </div>
      )}
      
      {!loading && (
        <>
          {/* Header */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <h1 className="text-3xl font-bold text-foreground">System Configuration</h1>
              <p className="text-muted-foreground">Configure IDS/IPS system settings and parameters</p>
            </div>
            <div className="flex items-center space-x-2">
              {unsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Unsaved Changes
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={resetConfig}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button size="sm" onClick={saveConfig} disabled={!unsavedChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </motion.div>

          {/* Configuration Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
        <Tabs defaultValue="detection" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="detection">Detection</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="blocking">Blocking</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="detection" className="space-y-6">
            <ConfigSection
              title="Detection Methods"
              description="Configure which detection methods are active"
            >
              <SettingRow
                label="Signature-based Detection"
                description="Detect known threats using signature patterns"
              >
                <Switch
                  checked={config.signatureDetection}
                  onCheckedChange={(value) => updateConfig('signatureDetection', value)}
                />
              </SettingRow>

              <SettingRow
                label="Anomaly Detection"
                description="Detect unusual behavior patterns"
              >
                <Switch
                  checked={config.anomalyDetection}
                  onCheckedChange={(value) => updateConfig('anomalyDetection', value)}
                />
              </SettingRow>

              <SettingRow
                label="Machine Learning Detection"
                description="Use ML models for threat detection"
              >
                <Switch
                  checked={config.mlDetection}
                  onCheckedChange={(value) => updateConfig('mlDetection', value)}
                />
              </SettingRow>

              <SettingRow
                label="Behavioral Analysis"
                description="Analyze connection patterns and behaviors"
              >
                <Switch
                  checked={config.behavioralAnalysis}
                  onCheckedChange={(value) => updateConfig('behavioralAnalysis', value)}
                />
              </SettingRow>
            </ConfigSection>

            <ConfigSection
              title="Detection Thresholds"
              description="Configure sensitivity thresholds for detection methods"
            >
              <SettingRow
                label="Anomaly Threshold"
                description="Z-score threshold for anomaly detection (higher = less sensitive)"
              >
                <Input
                  type="number"
                  step="0.1"
                  value={config.anomalyThreshold}
                  onChange={(e) => updateConfig('anomalyThreshold', parseFloat(e.target.value))}
                  className="w-24"
                />
              </SettingRow>

              <SettingRow
                label="ML Confidence Threshold"
                description="Minimum confidence for ML predictions (0.0 - 1.0)"
              >
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={config.mlConfidenceThreshold}
                  onChange={(e) => updateConfig('mlConfidenceThreshold', parseFloat(e.target.value))}
                  className="w-24"
                />
              </SettingRow>

              <SettingRow
                label="Threat Score Threshold"
                description="Minimum threat score to trigger alerts (0.0 - 1.0)"
              >
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={config.threatScoreThreshold}
                  onChange={(e) => updateConfig('threatScoreThreshold', parseFloat(e.target.value))}
                  className="w-24"
                />
              </SettingRow>
            </ConfigSection>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <ConfigSection
              title="Network Monitoring"
              description="Configure network interfaces and capture settings"
            >
              <SettingRow
                label="Monitored Interfaces"
                description="Network interfaces to monitor for traffic"
              >
                <Input
                  value={config.monitoredInterfaces.join(', ')}
                  onChange={(e) => updateConfig('monitoredInterfaces', e.target.value.split(', '))}
                  placeholder="eth0, eth1"
                  className="w-48"
                />
              </SettingRow>

              <SettingRow
                label="Capture Buffer Size (MB)"
                description="Size of packet capture buffer in memory"
              >
                <Input
                  type="number"
                  value={config.captureBufferSize}
                  onChange={(e) => updateConfig('captureBufferSize', parseInt(e.target.value))}
                  className="w-24"
                />
              </SettingRow>

              <SettingRow
                label="Max Packets/Second"
                description="Maximum packets to process per second"
              >
                <Input
                  type="number"
                  value={config.maxPacketsPerSecond}
                  onChange={(e) => updateConfig('maxPacketsPerSecond', parseInt(e.target.value))}
                  className="w-32"
                />
              </SettingRow>
            </ConfigSection>

            <ConfigSection
              title="Traffic Filtering"
              description="Configure traffic filtering and analysis rules"
            >
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Custom Filter Rules</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    BPF-style filter expressions (one per line)
                  </p>
                  <Textarea
                    placeholder="tcp port 80&#10;udp port 53&#10;icmp"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </ConfigSection>
          </TabsContent>

          <TabsContent value="blocking" className="space-y-6">
            <ConfigSection
              title="Automatic Blocking"
              description="Configure automatic IP blocking for detected threats"
            >
              <SettingRow
                label="Enable Auto-blocking"
                description="Automatically block IPs that trigger high-severity alerts"
              >
                <Switch
                  checked={config.autoBlocking}
                  onCheckedChange={(value) => updateConfig('autoBlocking', value)}
                />
              </SettingRow>

              <SettingRow
                label="Block Duration (seconds)"
                description="How long to block IPs (0 = permanent)"
              >
                <Input
                  type="number"
                  value={config.blockDuration}
                  onChange={(e) => updateConfig('blockDuration', parseInt(e.target.value))}
                  className="w-32"
                />
              </SettingRow>
            </ConfigSection>

            <ConfigSection
              title="Whitelist Management"
              description="Manage IP addresses that should never be blocked"
            >
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Whitelisted IP Addresses</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    IP addresses or CIDR ranges (one per line)
                  </p>
                  <Textarea
                    value={config.whitelistedIPs.join('\n')}
                    onChange={(e) => updateConfig('whitelistedIPs', e.target.value.split('\n').filter(ip => ip.trim()))}
                    placeholder="127.0.0.1&#10;192.168.1.0/24&#10;10.0.0.0/8"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </ConfigSection>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <ConfigSection
              title="Alert Channels"
              description="Configure how and where alerts are sent"
            >
              <SettingRow
                label="Email Alerts"
                description="Send alerts via email"
              >
                <Switch
                  checked={config.emailAlerts}
                  onCheckedChange={(value) => updateConfig('emailAlerts', value)}
                />
              </SettingRow>

              <SettingRow
                label="SMS Alerts"
                description="Send critical alerts via SMS"
              >
                <Switch
                  checked={config.smsAlerts}
                  onCheckedChange={(value) => updateConfig('smsAlerts', value)}
                />
              </SettingRow>

              <SettingRow
                label="Webhook Alerts"
                description="Send alerts to webhook endpoint"
              >
                <Switch
                  checked={config.webhookAlerts}
                  onCheckedChange={(value) => updateConfig('webhookAlerts', value)}
                />
              </SettingRow>
            </ConfigSection>

            <ConfigSection
              title="Alert Configuration"
              description="Configure alert destinations and formats"
            >
              <SettingRow
                label="Alert Email Address"
                description="Email address to receive security alerts"
              >
                <Input
                  type="email"
                  value={config.alertEmail}
                  onChange={(e) => updateConfig('alertEmail', e.target.value)}
                  className="w-64"
                />
              </SettingRow>

              <SettingRow
                label="Webhook URL"
                description="HTTP endpoint for webhook alerts"
              >
                <Input
                  type="url"
                  value={config.webhookUrl}
                  onChange={(e) => updateConfig('webhookUrl', e.target.value)}
                  className="w-80"
                />
              </SettingRow>
            </ConfigSection>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <ConfigSection
              title="Logging Configuration"
              description="Configure system logging and retention"
            >
              <SettingRow
                label="Log Level"
                description="Minimum log level to record"
              >
                <Select value={config.logLevel} onValueChange={(value) => updateConfig('logLevel', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBUG">DEBUG</SelectItem>
                    <SelectItem value="INFO">INFO</SelectItem>
                    <SelectItem value="WARNING">WARNING</SelectItem>
                    <SelectItem value="ERROR">ERROR</SelectItem>
                    <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow
                label="Log Retention (days)"
                description="How long to keep log files"
              >
                <Input
                  type="number"
                  value={config.logRetention}
                  onChange={(e) => updateConfig('logRetention', parseInt(e.target.value))}
                  className="w-24"
                />
              </SettingRow>

              <SettingRow
                label="Enable Syslog"
                description="Send logs to remote syslog server"
              >
                <Switch
                  checked={config.enableSyslog}
                  onCheckedChange={(value) => updateConfig('enableSyslog', value)}
                />
              </SettingRow>

              <SettingRow
                label="Syslog Server"
                description="IP address of syslog server"
              >
                <Input
                  value={config.syslogServer}
                  onChange={(e) => updateConfig('syslogServer', e.target.value)}
                  className="w-40"
                  disabled={!config.enableSyslog}
                />
              </SettingRow>
            </ConfigSection>

            <ConfigSection
              title="Performance Limits"
              description="Configure system resource usage limits"
            >
              <SettingRow
                label="Max CPU Usage (%)"
                description="Maximum CPU usage before throttling"
              >
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={config.maxCpuUsage}
                  onChange={(e) => updateConfig('maxCpuUsage', parseInt(e.target.value))}
                  className="w-24"
                />
              </SettingRow>

              <SettingRow
                label="Max Memory Usage (%)"
                description="Maximum memory usage before cleanup"
              >
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={config.maxMemoryUsage}
                  onChange={(e) => updateConfig('maxMemoryUsage', parseInt(e.target.value))}
                  className="w-24"
                />
              </SettingRow>

              <SettingRow
                label="Thread Pool Size"
                description="Number of worker threads for processing"
              >
                <Input
                  type="number"
                  min="1"
                  max="32"
                  value={config.threadPoolSize}
                  onChange={(e) => updateConfig('threadPoolSize', parseInt(e.target.value))}
                  className="w-24"
                />
              </SettingRow>
            </ConfigSection>
          </TabsContent>
        </Tabs>
          </motion.div>

          {/* Status Footer */}
          <motion.div
            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-muted-foreground">
            {lastSaved ? `Configuration last saved: ${lastSaved}` : 'Configuration not yet saved'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-muted-foreground">
            Configuration is stored persistently in database
          </span>
        </div>
      </motion.div>
        </>
      )}
    </div>
  )
}

export default SystemConfig

