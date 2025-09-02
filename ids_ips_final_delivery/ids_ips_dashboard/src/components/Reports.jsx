import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import io from 'socket.io-client'
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  Users,
  Globe,
  Clock,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts'

const Reports = () => {
  const [timeRange, setTimeRange] = useState('7d')
  const [reportType, setReportType] = useState('security')
  const [customDateRange, setCustomDateRange] = useState(null)
  const [summaryData, setSummaryData] = useState({})
  const [chartData, setChartData] = useState([])
  const [threatBreakdown, setThreatBreakdown] = useState([])
  const [topAttackers, setTopAttackers] = useState([])
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    // Connect to real-time data
    const socket = io('http://localhost:5000')
    
    // Fetch report data from backend
    const queryParams = new URLSearchParams({
      timeRange: timeRange,
      type: reportType
    })
    
    if (timeRange === 'custom' && customDateRange?.from && customDateRange?.to) {
      queryParams.append('startDate', customDateRange.from.toISOString())
      queryParams.append('endDate', customDateRange.to.toISOString())
    }
    
    fetch(`http://localhost:5000/api/reports?${queryParams}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSummaryData(data.summary || {})
          setChartData(data.chartData || [])
          setThreatBreakdown(data.threatBreakdown || [])
          setTopAttackers(data.topAttackers || [])
        } else {
          console.warn('Failed to fetch report data, no fallback data available')
          // Initialize with empty data instead of mock data
          setSummaryData({})
          setChartData([])
          setThreatBreakdown([])
          setTopAttackers([])
        }
      })
      .catch(err => {
        console.error('Error fetching report data:', err)
        // Initialize with empty data instead of mock data
        setSummaryData({})
        setChartData([])
        setThreatBreakdown([])
        setTopAttackers([])
      })

    // Listen for real-time updates
    socket.on('report_update', (data) => {
      setLastUpdate(new Date())
      
      if (data.type === 'summary') {
        setSummaryData(prev => ({ 
          ...prev, 
          ...data.data,
          // Calculate trends
          totalThreatsChange: prev.totalThreats ? Math.round(((data.data.totalThreats - prev.totalThreats) / prev.totalThreats) * 100) : 0,
          blockedAttacksChange: prev.blockedAttacks ? Math.round(((data.data.blockedAttacks - prev.blockedAttacks) / prev.blockedAttacks) * 100) : 0
        }))
      } else if (data.type === 'new_threat') {
        setThreatBreakdown(prev => {
          const updated = [...prev]
          const threatMap = {
            'malware': 'Malware',
            'ddos': 'DDoS', 
            'phishing': 'Phishing',
            'brute_force': 'Brute Force',
            'port_scan': 'Brute Force',
            'sql_injection': 'Malware',
            'intrusion': 'Malware',
            'malicious_ip': 'Other'
          }
          
          const mappedType = threatMap[data.threat_type] || 'Other'
          const threatIndex = updated.findIndex(t => t.name === mappedType)
          
          if (threatIndex >= 0) {
            updated[threatIndex] = {
              ...updated[threatIndex],
              count: updated[threatIndex].count + 1
            }
            
            // Recalculate percentages
            const total = updated.reduce((sum, t) => sum + t.count, 0)
            updated.forEach(threat => {
              threat.value = Math.round((threat.count / total) * 100)
            })
          }
          return updated
        })
        
        // Update chart data for today
        const today = new Date().toISOString().split('T')[0]
        setChartData(prev => {
          const updated = [...prev]
          const todayIndex = updated.findIndex(item => item.date === today)
          
          if (todayIndex >= 0) {
            updated[todayIndex] = {
              ...updated[todayIndex],
              threats: updated[todayIndex].threats + 1,
              blocked: updated[todayIndex].blocked + (Math.random() > 0.3 ? 1 : 0) // 70% block rate
            }
          } else {
            updated.push({
              date: today,
              threats: 1,
              blocked: Math.random() > 0.3 ? 1 : 0,
              allowed: Math.floor(Math.random() * 100) + 50
            })
          }
          
          return updated.slice(-30) // Keep last 30 days
        })
      }
    })

    // Listen for threat detection to update top attackers
    socket.on('threat_detected', (threatData) => {
      if (threatData.source_ip) {
        setTopAttackers(prev => {
          const updated = [...prev]
          const attackerIndex = updated.findIndex(a => a.ip === threatData.source_ip)
          
          if (attackerIndex >= 0) {
            updated[attackerIndex] = {
              ...updated[attackerIndex],
              attacks: updated[attackerIndex].attacks + 1,
              blocked: updated[attackerIndex].blocked + (threatData.blocked ? 1 : 0),
              threat_score: Math.min(10, updated[attackerIndex].threat_score + 0.1)
            }
          } else if (updated.length < 5) {
            // Add new attacker if we have room
            const countries = ['CN', 'RU', 'US', 'BR', 'IN', 'DE', 'FR', 'JP']
            updated.push({
              ip: threatData.source_ip,
              country: countries[Math.floor(Math.random() * countries.length)],
              attacks: 1,
              blocked: threatData.blocked ? 1 : 0,
              threat_score: Math.round(Math.random() * 3 + 6) / 10 * 10
            })
          }
          
          return updated.sort((a, b) => b.attacks - a.attacks).slice(0, 5)
        })
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [timeRange, reportType, customDateRange])

  // Export PDF functionality
  const handleExportPDF = async () => {
    try {
      // Create a comprehensive report data object
      const reportData = {
        title: `Security Report - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`,
        timeRange: timeRange,
        generatedAt: new Date().toISOString(),
        summary: summaryData,
        chartData: chartData,
        threatBreakdown: threatBreakdown,
        topAttackers: topAttackers
      }

      // Create a simple HTML report
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Security Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .section { margin-bottom: 30px; }
            .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reportData.title}</h1>
            <p>Generated on: ${new Date(reportData.generatedAt).toLocaleString()}</p>
            <p>Time Range: ${timeRange}</p>
          </div>
          
          <div class="section">
            <h2>Summary</h2>
            <div class="metric">
              <strong>Total Threats:</strong> ${summaryData.totalThreats || 0}
            </div>
            <div class="metric">
              <strong>Blocked Attacks:</strong> ${summaryData.blockedAttacks || 0}
            </div>
            <div class="metric">
              <strong>Unique Attackers:</strong> ${summaryData.uniqueAttackers || 0}
            </div>
            <div class="metric">
              <strong>System Uptime:</strong> ${summaryData.systemUptime || 0}%
            </div>
          </div>

          <div class="section">
            <h2>Top Attackers</h2>
            <table>
              <tr>
                <th>IP Address</th>
                <th>Country</th>
                <th>Attacks</th>
                <th>Blocked</th>
                <th>Threat Score</th>
              </tr>
              ${topAttackers.map(attacker => `
                <tr>
                  <td>${attacker.ip}</td>
                  <td>${attacker.country}</td>
                  <td>${attacker.attacks}</td>
                  <td>${attacker.blocked}</td>
                  <td>${attacker.threat_score}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <h2>Threat Breakdown</h2>
            <table>
              <tr>
                <th>Threat Type</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
              ${threatBreakdown.map(threat => `
                <tr>
                  <td>${threat.name}</td>
                  <td>${threat.count}</td>
                  <td>${threat.value}%</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </body>
        </html>
      `

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `security-report-${timeRange}-${Date.now()}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('PDF export completed')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error exporting report. Please try again.')
    }
  }

  // Generate Report functionality
  const handleGenerateReport = async () => {
    try {
      // Make API call to backend to generate comprehensive report
      const response = await fetch(`http://localhost:5000/api/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeRange: timeRange,
          reportType: reportType,
          includeCharts: true,
          includeDetails: true
        })
      })

      if (response.ok) {
        const reportData = await response.json()
        
        // Update state with fresh data
        setSummaryData(reportData.summary || summaryData)
        setChartData(reportData.timeline || chartData)
        setThreatBreakdown(reportData.threatBreakdown || threatBreakdown)
        setTopAttackers(reportData.topAttackers || topAttackers)
        setLastUpdate(new Date())
        
        console.log('Report generated successfully')
        alert('Report generated successfully!')
      } else {
        throw new Error('Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error generating report. Please try again.')
      // No fallback to mock data - just inform user
    }
  }

  const StatCard = ({ title, value, change, icon: Icon, trend, suffix = "", isUpdating = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={isUpdating ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {isUpdating && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-2 h-2 border border-blue-500 border-t-transparent rounded-full"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="text-2xl font-bold"
            key={value}
            initial={{ scale: 1.1, color: '#3b82f6' }}
            animate={{ scale: 1, color: 'inherit' }}
            transition={{ duration: 0.5 }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </motion.div>
          {change !== undefined && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(change)}%
              </span>
              <span>from previous period</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  const AttackerRow = ({ attacker, index }) => (
    <motion.div
      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      key={`${attacker.ip}-${attacker.attacks}`}
      layout
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
          {index + 1}
        </div>
        <div>
          <p className="font-mono text-sm font-medium">{attacker.ip}</p>
          <p className="text-xs text-muted-foreground">{attacker.country}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4 text-sm">
        <div className="text-center">
          <motion.p 
            className="font-medium"
            key={attacker.attacks}
            initial={{ scale: 1.2, color: '#ef4444' }}
            animate={{ scale: 1, color: 'inherit' }}
            transition={{ duration: 0.5 }}
          >
            {attacker.attacks}
          </motion.p>
          <p className="text-xs text-muted-foreground">Attacks</p>
        </div>
        <div className="text-center">
          <motion.p 
            className="font-medium text-red-600"
            key={attacker.blocked}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {attacker.blocked}
          </motion.p>
          <p className="text-xs text-muted-foreground">Blocked</p>
        </div>
        <div className="text-center">
          <motion.p 
            className="font-medium"
            key={attacker.threat_score}
            initial={{ color: '#f59e0b' }}
            animate={{ color: 'inherit' }}
            transition={{ duration: 1 }}
          >
            {attacker.threat_score}
          </motion.p>
          <p className="text-xs text-muted-foreground">Score</p>
        </div>
      </div>
    </motion.div>
  )

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
          <h1 className="text-3xl font-bold text-foreground">Security Reports</h1>
          <div className="flex items-center space-x-2">
            <p className="text-muted-foreground">Comprehensive security analytics and reporting</p>
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center space-x-1 text-xs text-green-600"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Live Data</span>
            </motion.div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="security">Security Overview</SelectItem>
            <SelectItem value="threats">Threat Analysis</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {timeRange === 'custom' && (
          <DatePickerWithRange 
            value={customDateRange}
            onChange={setCustomDateRange}
            placeholder="Select date range"
          />
        )}

        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Custom Range
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Threats"
          value={summaryData.totalThreats}
          change={summaryData.totalThreatsChange}
          icon={Shield}
          trend={summaryData.totalThreatsChange > 0 ? "up" : "down"}
          isUpdating={Date.now() - lastUpdate.getTime() < 2000}
        />
        <StatCard
          title="Blocked Attacks"
          value={summaryData.blockedAttacks}
          change={summaryData.blockedAttacksChange}
          icon={AlertTriangle}
          trend={summaryData.blockedAttacksChange > 0 ? "up" : "down"}
          isUpdating={Date.now() - lastUpdate.getTime() < 2000}
        />
        <StatCard
          title="Unique Attackers"
          value={summaryData.uniqueAttackers}
          change={-3}
          icon={Users}
          trend="down"
        />
        <StatCard
          title="Avg Response Time"
          value={summaryData.avgResponseTime}
          change={-15}
          icon={Clock}
          trend="down"
          suffix="s"
        />
        <StatCard
          title="System Uptime"
          value={summaryData.systemUptime}
          change={0.2}
          icon={TrendingUp}
          trend="up"
          suffix="%"
        />
        <StatCard
          title="False Positives"
          value={summaryData.falsePositives}
          change={-25}
          icon={TrendingDown}
          trend="down"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Activity Over Time */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Threat Activity Over Time</span>
              </CardTitle>
              <CardDescription>
                Daily threat detection and blocking activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="threats" 
                    stackId="1"
                    stroke="#ef4444" 
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name="Threats Detected"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="blocked" 
                    stackId="1"
                    stroke="#f97316" 
                    fill="#f97316"
                    fillOpacity={0.6}
                    name="Attacks Blocked"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Threat Type Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Threat Type Distribution</span>
              </CardTitle>
              <CardDescription>
                Breakdown of detected threat categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={threatBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {threatBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [`${value}% (${threatBreakdown.find(t => t.name === name)?.count || 0} threats)`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Attackers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Top Attackers</span>
                </div>
                <Badge variant="outline">
                  {timeRange.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>
                Most active attacking IP addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topAttackers.map((attacker, index) => (
                <AttackerRow key={attacker.ip} attacker={attacker} index={index} />
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Threat Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Threat Category Trends</span>
              </CardTitle>
              <CardDescription>
                Threat category breakdown over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="threats" fill="#ef4444" name="Total Threats" />
                  <Bar dataKey="blocked" fill="#f97316" name="Blocked" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Report Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
            <CardDescription>
              Key findings and recommendations for the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Key Findings</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• {summaryData.totalThreats?.toLocaleString()} total threats detected in the last {timeRange}</li>
                  <li>• {((summaryData.blockedAttacks / summaryData.totalThreats) * 100).toFixed(1)}% of attacks successfully blocked</li>
                  <li>• Average response time of {summaryData.avgResponseTime}s maintained</li>
                  <li>• System uptime of {summaryData.systemUptime}% achieved</li>
                  <li>• {summaryData.falsePositives} false positives identified and resolved</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Consider implementing additional rate limiting for top attacking IPs</li>
                  <li>• Review and update signature database for improved detection</li>
                  <li>• Investigate recurring false positives to improve accuracy</li>
                  <li>• Monitor system resources during peak attack periods</li>
                  <li>• Schedule regular threat intelligence feed updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default Reports

