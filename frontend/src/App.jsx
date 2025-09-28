import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import Layout from './components/Layout'
import './App.css'

// Lazy loading para mejorar el rendimiento
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const HealthPage = lazy(() => import('./components/HealthPage'))
const FinancePage = lazy(() => import('./components/FinancePage'))
const IncomesPage = lazy(() => import('./components/IncomesPage'))
const BudgetPage = lazy(() => import('./components/BudgetPage'))

// Componente de loading
const LoadingSpinner = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="200px"
    sx={{ 
      background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
      color: 'white'
    }}
  >
    <CircularProgress color="primary" />
  </Box>
)

function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/incomes" element={<IncomesPage />} />
            <Route path="/budgets" element={<BudgetPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  )
}

export default App