import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import io from 'socket.io-client'
import {
  AlertTriangle,
  Shield,
  Clock,
  Filter,
  Search,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([])
  const [filteredAlerts, setFilteredAlerts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    // Connect to real-time data
    const socket = io('http://localhost:5000')
    
    // Fetch initial alerts
    fetch('http://localhost:5000/api/alerts')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.alerts) {
          const formattedAlerts = data.alerts.map((alert, index) => ({
            id: alert.id || index + 1,
            type: alert.threat_type || alert.type || 'Unknown Threat',
            severity: alert.severity || 'medium',
            status: alert.status || 'active',
            timestamp: alert.timestamp || new Date().toISOString(),
            source: alert.source_ip || alert.source || 'Unknown',
            destination: alert.destination_ip || alert.destination || 'Unknown',
            description: alert.description || `${alert.threat_type} detected`,
            details: alert.details || 'Security threat detected in network traffic',
            action: alert.action_taken || 'Alert generated',
            ruleId: alert.rule_id || `RULE_${index + 1}`
          }))
          setAlerts(formattedAlerts)
          setFilteredAlerts(formattedAlerts)
        }
      })
      .catch(err => {
        console.error('Failed to fetch alerts:', err)
        // No fallback mock data - use empty arrays to show real status
        setAlerts([])
        setFilteredAlerts([])
      })

    // Listen for real-time alerts
    socket.on('new_alert', (alertData) => {
      const newAlert = {
        id: Date.now(),
        type: alertData.threat_type || 'Security Alert',
        severity: alertData.severity || 'medium',
        status: 'active',
        timestamp: new Date().toISOString(),
        source: alertData.source_ip || 'Unknown',
        destination: alertData.destination_ip || 'Unknown',
        description: alertData.description || `${alertData.threat_type} detected`,
        details: alertData.details || 'Real-time security threat detected',
        action: 'Investigating',
        ruleId: alertData.rule_id || `RT_${Date.now()}`
      }
      
      setAlerts(prev => [newAlert, ...prev])
      setFilteredAlerts(prev => [newAlert, ...prev])
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    let filtered = alerts

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(alert => alert.status === statusFilter)
    }

    setFilteredAlerts(filtered)
  }, [alerts, searchTerm, severityFilter, statusFilter])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return XCircle
      case 'high': return AlertCircle
      case 'medium': return AlertTriangle
      case 'low': return Info
      default: return AlertTriangle
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'destructive'
      case 'investigating': return 'secondary'
      case 'resolved': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return AlertTriangle
      case 'investigating': return Eye
      case 'resolved': return CheckCircle
      default: return Clock
    }
  }

  const AlertCard = ({ alert }) => {
    const SeverityIcon = getSeverityIcon(alert.severity)
    const StatusIcon = getStatusIcon(alert.status)

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)} bg-opacity-20`}>
                  <SeverityIcon className={`h-5 w-5 ${getSeverityColor(alert.severity).replace('bg-', 'text-')}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{alert.type}</CardTitle>
                  <CardDescription className="flex items-center space-x-2 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusColor(alert.status)} className="flex items-center space-x-1">
                  <StatusIcon className="h-3 w-3" />
                  <span className="capitalize">{alert.status}</span>
                </Badge>
                <Badge variant="outline" className={`${getSeverityColor(alert.severity)} text-white border-0`}>
                  {alert.severity.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{alert.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Source:</span>
                  <p className="font-mono">{alert.source}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Destination:</span>
                  <p className="font-mono">{alert.destination}</p>
                </div>
              </div>

              <div className="text-sm">
                <span className="font-medium text-muted-foreground">Details:</span>
                <p className="mt-1">{alert.details}</p>
              </div>

              <div className="text-sm">
                <span className="font-medium text-muted-foreground">Action Taken:</span>
                <p className="mt-1">{alert.action}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Rule ID: {alert.ruleId}</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                  {alert.status === 'active' && (
                    <Button variant="outline" size="sm">
                      <Ban className="h-3 w-3 mr-1" />
                      Block
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const alertStats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    resolved: alerts.filter(a => a.status === 'resolved').length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Alerts</h1>
          <p className="text-muted-foreground">Monitor and manage security incidents</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-red-600 border-red-600">
            {alertStats.active} Active
          </Badge>
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{alertStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{alertStats.active}</p>
                  <p className="text-xs text-muted-foreground">Active Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{alertStats.critical}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{alertStats.resolved}</p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Alerts List */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No alerts found</h3>
              <p className="text-muted-foreground">
                {searchTerm || severityFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No security alerts at this time.'}
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}

export default AlertsPage

