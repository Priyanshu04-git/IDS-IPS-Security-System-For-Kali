import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  Ban,
  Zap,
  Globe,
  Wifi,
  WifiOff
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import io from 'socket.io-client'

const API_BASE_URL = 'http://localhost:5000'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalThreats: 0,
    blockedIPs: 0,
    activeConnections: 0,
    systemHealth: 98
  })

  const [systemStatus, setSystemStatus] = useState({
    running: false,
    connected: false,
    lastUpdate: null
  })

  const [realtimeData, setRealtimeData] = useState([])
  const [threatData, setThreatData] = useState([])
  const [protocolData, setProtocolData] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [socket, setSocket] = useState(null)

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Connected to IDS/IPS system')
      setSystemStatus(prev => ({ ...prev, connected: true }))
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from IDS/IPS system')
      setSystemStatus(prev => ({ ...prev, connected: false }))
    })

    newSocket.on('system_stats', (data) => {
      console.log('Received system stats:', data)
      updateStatsFromRealData(data)
      setSystemStatus(prev => ({ 
        ...prev, 
        lastUpdate: new Date().toLocaleTimeString(),
        running: true 
      }))
    })

    newSocket.on('recent_alerts', (alerts) => {
      console.log('Received alerts:', alerts)
      setRecentAlerts(alerts.slice(0, 5)) // Show latest 5 alerts
    })

    setSocket(newSocket)

    return () => newSocket.close()
  }, [])

  // Fetch initial data and periodic updates
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/status`)
        const data = await response.json()
        console.log('System status:', data)
        
        if (data.stats) {
          updateStatsFromRealData(data.stats)
        }
        
        setSystemStatus(prev => ({
          ...prev,
          running: data.running,
          lastUpdate: new Date().toLocaleTimeString()
        }))
      } catch (error) {
        console.error('Error fetching system status:', error)
        setSystemStatus(prev => ({ ...prev, connected: false }))
      }
    }

    // Initial fetch
    fetchSystemStatus()

    // Fallback polling if WebSocket fails
    const interval = setInterval(fetchSystemStatus, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const updateStatsFromRealData = (data) => {
    // Update main stats
    setStats(prev => ({
      totalThreats: data.warnings + data.errors + data.critical || prev.totalThreats,
      blockedIPs: data.ips_blocked || prev.blockedIPs,
      activeConnections: data.packets_processed || prev.activeConnections,
      systemHealth: systemStatus.connected ? 98 : 85
    }))

    // Update real-time chart data
    const now = new Date()
    const newDataPoint = {
      time: now.toLocaleTimeString(),
      threats: (data.warnings || 0) + (data.errors || 0),
      blocked: data.ips_blocked || 0,
      connections: data.packets_processed || 0,
      critical: data.critical || 0
    }
    
    setRealtimeData(prev => [...prev.slice(-19), newDataPoint])

    // Update threat distribution
    if (data.warnings || data.errors || data.critical) {
      setThreatData([
        { name: 'Critical', value: data.critical || 0, color: '#ef4444' },
        { name: 'Errors', value: data.errors || 0, color: '#f97316' },
        { name: 'Warnings', value: data.warnings || 0, color: '#eab308' },
        { name: 'Normal', value: Math.max(0, data.total_events - (data.warnings + data.errors + data.critical)), color: '#22c55e' }
      ])
    }
  }

  // Manual refresh function
  const handleRefresh = () => {
    if (socket) {
      socket.emit('request_update')
    }
  }

  const StatCard = ({ title, value, change, icon: Icon, trend, color = "blue" }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`h-4 w-4 text-${color}-500`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {change}%
            </span>
            <span>from last hour</span>
          </div>
        </CardContent>
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${color}-500 to-${color}-600`} />
      </Card>
    </motion.div>
  )

  const RecentAlert = ({ alert }) => {
    const getSeverityInfo = (severity) => {
      switch (severity?.toLowerCase()) {
        case 'critical':
          return { color: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400', badge: 'destructive' }
        case 'error':
          return { color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400', badge: 'destructive' }
        case 'warning':
          return { color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400', badge: 'secondary' }
        default:
          return { color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', badge: 'secondary' }
      }
    }

    const severityInfo = getSeverityInfo(alert.severity)
    const timeAgo = alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Unknown'

    return (
      <motion.div
        className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`p-2 rounded-full ${severityInfo.color}`}>
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{alert.threat_type || alert.message}</p>
          <p className="text-xs text-muted-foreground">
            {alert.source_ip && `From ${alert.source_ip} • `}{alert.message}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">{timeAgo}</div>
        <Badge variant={severityInfo.badge}>
          {alert.severity || 'info'}
        </Badge>
      </motion.div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-full overflow-auto min-h-screen">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time network security monitoring
            {systemStatus.lastUpdate && (
              <span className="ml-2 text-xs">
                • Last update: {systemStatus.lastUpdate}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={systemStatus.connected && systemStatus.running 
              ? "text-green-600 border-green-600" 
              : "text-red-600 border-red-600"
            }
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${
              systemStatus.connected && systemStatus.running 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-red-500'
            }`} />
            {systemStatus.connected && systemStatus.running ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                System Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                {systemStatus.connected ? 'System Offline' : 'Disconnected'}
              </>
            )}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <Eye className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Threats Detected"
          value={stats.totalThreats}
          change={12}
          icon={Shield}
          trend="up"
          color="red"
        />
        <StatCard
          title="Blocked IPs"
          value={stats.blockedIPs}
          change={8}
          icon={Ban}
          trend="up"
          color="orange"
        />
        <StatCard
          title="Active Connections"
          value={stats.activeConnections}
          change={-3}
          icon={Users}
          trend="down"
          color="blue"
        />
        <StatCard
          title="System Health"
          value={stats.systemHealth}
          change={2}
          icon={Activity}
          trend="up"
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Activity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Real-time Activity</span>
              </CardTitle>
              <CardDescription>
                Live network traffic and threat detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={realtimeData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="threats" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Threats"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="blocked" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    name="Blocked"
                    dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Threat Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Threat Distribution</span>
              </CardTitle>
              <CardDescription>
                Breakdown of detected threat types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={threatData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {threatData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Recent Alerts</span>
                </div>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardTitle>
              <CardDescription>
                Latest security alerts and incidents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <RecentAlert key={alert.id || alert.timestamp} alert={alert} />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent alerts</p>
                  <p className="text-xs">System monitoring for threats...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>System Status</span>
              </CardTitle>
              <CardDescription>
                Current system performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>CPU Usage</span>
                  <span>45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Memory Usage</span>
                  <span>67%</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Network Load</span>
                  <span>23%</span>
                </div>
                <Progress value={23} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Detection Rate</span>
                  <span>98%</span>
                </div>
                <Progress value={98} className="h-2" />
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-medium">15d 7h 23m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Update</span>
                    <span className="font-medium">2 hours ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
    </div>
  );
};

export default Dashboard

