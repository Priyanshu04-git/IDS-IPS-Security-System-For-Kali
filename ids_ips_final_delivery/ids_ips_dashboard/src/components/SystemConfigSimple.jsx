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

const SystemConfigSimple = () => {
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
  const [loading, setLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [error, setError] = useState(null)

  // Load configuration from backend on component mount
  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading configuration from backend...')
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
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error loading configuration:', error)
      setError(`Failed to load configuration: ${error.message}`)
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
      setError(null)
      
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      setError(`Failed to save configuration: ${error.message}`)
    }
  }

  const resetConfig = () => {
    loadConfiguration()  // Reload from backend
    setUnsavedChanges(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading configuration...</span>
        </div>
      )}
      
      {/* Main Content */}
      {!loading && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
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
          </div>

          {/* Simple Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Configuration</CardTitle>
              <CardDescription>Essential IDS/IPS settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Detection Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Detection Methods</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Signature Detection</Label>
                    <p className="text-sm text-muted-foreground">Enable signature-based threat detection</p>
                  </div>
                  <Switch
                    checked={config.signatureDetection}
                    onCheckedChange={(value) => updateConfig('signatureDetection', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Anomaly Detection</Label>
                    <p className="text-sm text-muted-foreground">Enable anomaly-based threat detection</p>
                  </div>
                  <Switch
                    checked={config.anomalyDetection}
                    onCheckedChange={(value) => updateConfig('anomalyDetection', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Machine Learning Detection</Label>
                    <p className="text-sm text-muted-foreground">Enable ML-based threat detection</p>
                  </div>
                  <Switch
                    checked={config.mlDetection}
                    onCheckedChange={(value) => updateConfig('mlDetection', value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Network Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Network Settings</h3>
                
                <div className="space-y-2">
                  <Label>Capture Buffer Size (MB)</Label>
                  <Input
                    type="number"
                    value={config.captureBufferSize}
                    onChange={(e) => updateConfig('captureBufferSize', parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Packets/Second</Label>
                  <Input
                    type="number"
                    value={config.maxPacketsPerSecond}
                    onChange={(e) => updateConfig('maxPacketsPerSecond', parseInt(e.target.value))}
                    className="w-40"
                  />
                </div>
              </div>

              <Separator />

              {/* Blocking Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Blocking Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-blocking</Label>
                    <p className="text-sm text-muted-foreground">Automatically block malicious IPs</p>
                  </div>
                  <Switch
                    checked={config.autoBlocking}
                    onCheckedChange={(value) => updateConfig('autoBlocking', value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Block Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={config.blockDuration}
                    onChange={(e) => updateConfig('blockDuration', parseInt(e.target.value))}
                    className="w-40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Footer */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
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
          </div>
        </>
      )}
    </div>
  )
}

export default SystemConfigSimple
