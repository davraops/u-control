import React from 'react'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  HealthAndSafety as HealthIcon,
  AccountBalance as FinanceIcon,
  TrendingUp as IncomesIcon,
  AccountBalanceWallet as BudgetIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

const Layout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const getCurrentTab = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 0
      case '/health':
        return 1
      case '/finance':
        return 2
      case '/incomes':
        return 3
      case '/budgets':
        return 4
      default:
        return 0
    }
  }

  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/dashboard')
        break
      case 1:
        navigate('/health')
        break
      case 2:
        navigate('/finance')
        break
      case 3:
        navigate('/incomes')
        break
      case 4:
        navigate('/budgets')
        break
      default:
        navigate('/dashboard')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Navigation */}
      <AppBar position="static" sx={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)' }}>
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            🚀 u-control
          </Typography>
                  <Tabs value={getCurrentTab()} onChange={handleTabChange} textColor="inherit">
                    <Tab icon={<DashboardIcon />} label="Dashboard" />
                    <Tab icon={<HealthIcon />} label="Health" />
                    <Tab icon={<FinanceIcon />} label="Finanzas" />
                    <Tab icon={<IncomesIcon />} label="Ingresos" />
                    <Tab icon={<BudgetIcon />} label="Presupuestos" />
                  </Tabs>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>
    </Box>
  )
}

export default Layout
