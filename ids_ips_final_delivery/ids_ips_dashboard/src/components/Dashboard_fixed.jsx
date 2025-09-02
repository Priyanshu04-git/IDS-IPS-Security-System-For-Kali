import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { 
  Wifi, 
  WifiOff, 
  Eye, 
  AlertTriangle, 
  Shield, 
  Activity, 
  Clock,
  MapPin,
  TrendingUp,
  Users,
  BarChart,
  Settings,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const [systemStatus, setSystemStatus] = useState({
    connected: false,
    running: false,
    lastUpdate: null,
    totalThreats: 0,
    activeAlerts: 0,
    blockedIPs: 0
  });

  const [threats, setThreats] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setSystemStatus(prev => ({ ...prev, connected: true }));
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setSystemStatus(prev => ({ ...prev, connected: false }));
    });

    newSocket.on('threat_detected', (threatData) => {
      console.log('New threat detected:', threatData);
      setThreats(prev => {
        const updated = [threatData, ...prev.slice(0, 19)]; // Keep last 20
        return updated;
      });
      setSystemStatus(prev => ({ 
        ...prev, 
        totalThreats: prev.totalThreats + 1,
        lastUpdate: new Date().toLocaleTimeString()
      }));
    });

    newSocket.on('stats_update', (stats) => {
      console.log('Stats update:', stats);
      setSystemStatus(prev => ({ 
        ...prev, 
        running: true,
        totalThreats: stats.total_threats || prev.totalThreats,
        lastUpdate: new Date().toLocaleTimeString()
      }));
    });

    newSocket.on('system_stats', (stats) => {
      console.log('System stats:', stats);
      setSystemStatus(prev => ({ 
        ...prev, 
        running: true,
        activeAlerts: stats.alerts || 0,
        blockedIPs: stats.blocked_ips || 0
      }));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-full overflow-auto min-h-screen bg-background">
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
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.totalThreats}</div>
            <p className="text-xs text-muted-foreground">
              +{threats.length} in last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.blockedIPs}</div>
            <p className="text-xs text-muted-foreground">
              Auto-blocked today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus.connected && systemStatus.running ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStatus.connected ? 'Connected' : 'Disconnected'}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Real-time Threats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Threat Detection
            </CardTitle>
            <CardDescription>
              Live security events and threat detections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {threats.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No threats detected</p>
                  <p className="text-sm">System is monitoring for security events</p>
                </div>
              ) : (
                threats.map((threat, index) => (
                  <motion.div
                    key={threat.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        threat.severity === 'CRITICAL' ? 'bg-red-500' :
                        threat.severity === 'HIGH' ? 'bg-orange-500' :
                        threat.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <div className="font-medium text-sm">
                          {threat.threat_type || 'Unknown Threat'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          From {threat.source_ip || 'Unknown IP'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getSeverityColor(threat.severity)}`}
                      >
                        {threat.severity || 'Unknown'}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {threat.timestamp ? new Date(threat.timestamp).toLocaleTimeString() : 'Just now'}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
