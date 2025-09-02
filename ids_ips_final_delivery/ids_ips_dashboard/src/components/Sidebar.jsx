import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  Activity,
  Settings,
  FileText,
  Menu,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Target,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const Sidebar = ({ isOpen, onToggle, darkMode, onToggleTheme }) => {
  const location = useLocation()

  const menuItems = [
    {
      path: '/dashboard',
      icon: Activity,
      label: 'Dashboard',
      description: 'System overview and real-time monitoring'
    },
    {
      path: '/alerts',
      icon: AlertTriangle,
      label: 'Alerts',
      description: 'Security alerts and incidents'
    },
    {
      path: '/threats',
      icon: Target,
      label: 'Threat Intelligence',
      description: 'Threat analysis and intelligence feeds'
    },
    {
      path: '/reports',
      icon: BarChart3,
      label: 'Reports',
      description: 'Security reports and analytics'
    },
    {
      path: '/config',
      icon: Settings,
      label: 'Configuration',
      description: 'System settings and configuration'
    }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <TooltipProvider>
      <motion.aside
        className={`fixed left-0 top-0 h-full bg-card border-r border-border z-50 transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-16'
        }`}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2 bg-primary rounded-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            {isOpen && (
              <div>
                <h1 className="text-lg font-bold text-foreground">IDS/IPS</h1>
                <p className="text-xs text-muted-foreground">Security Monitor</p>
              </div>
            )}
          </motion.div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2"
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <li key={item.path}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${
                          active
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'}`} />
                        {isOpen && (
                          <motion.span
                            className="font-medium"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {!isOpen && (
                      <TooltipContent side="right" className="ml-2">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            {isOpen && (
              <motion.div
                className="text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <p>System Status</p>
                <div className="flex items-center space-x-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Online</span>
                </div>
              </motion.div>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleTheme}
                  className="p-2"
                >
                  {darkMode ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isOpen ? "top" : "right"}>
                <p>Toggle {darkMode ? 'light' : 'dark'} mode</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}

export default Sidebar

