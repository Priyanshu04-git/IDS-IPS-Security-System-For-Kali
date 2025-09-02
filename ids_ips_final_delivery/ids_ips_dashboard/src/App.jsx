import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './App.css'

// Components
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import AlertsPage from './components/AlertsPage'
import ThreatIntelligence from './components/ThreatIntelligence'
import SystemConfig from './components/SystemConfig'
import Reports from './components/Reports'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    setDarkMode(!darkMode)
    if (!darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="flex min-h-screen bg-background text-foreground">
          <Sidebar 
            isOpen={sidebarOpen} 
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            darkMode={darkMode}
            onToggleTheme={toggleTheme}
          />
          
          <motion.main 
            className={`flex-1 overflow-auto transition-all duration-300 ${
              sidebarOpen ? 'ml-64' : 'ml-16'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/threats" element={<ThreatIntelligence />} />
              <Route path="/config" element={<SystemConfig />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </motion.main>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App

