import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Divider,
  Paper,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Cloud as CloudIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
  Timeline as TimelineIcon,
  HealthAndSafety as HealthIcon,
  Monitor as MonitorIcon,
  Api as ApiIcon,
  Storage as DatabaseIcon,
  Lock as LockIcon,
} from '@mui/icons-material'

const API_BASE_URL = 'https://e6itg7gvz6.execute-api.us-east-1.amazonaws.com/dev'

const HealthPage = () => {
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      
      setHealthData(data)
      setLastChecked(new Date())
    } catch (err) {
      setError(err.message)
      setLastChecked(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'configured':
        return 'success'
      case 'warning':
        return 'warning'
      case 'error':
      case 'disconnected':
      case 'not configured':
        return 'error'
      default:
        return 'info'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'configured':
        return <CheckCircleIcon />
      case 'warning':
        return <WarningIcon />
      case 'error':
      case 'disconnected':
      case 'not configured':
        return <ErrorIcon />
      default:
        return <InfoIcon />
    }
  }

  const healthChecks = [
    {
      name: 'Frontend',
      status: 'healthy',
      description: 'React + Vite + Material UI',
      icon: <MonitorIcon sx={{ fontSize: 24 }} />,
      details: 'Aplicación frontend funcionando correctamente'
    },
    {
      name: 'Backend API',
      status: healthData?.status || 'error',
      description: 'AWS Lambda + API Gateway',
      icon: <ApiIcon sx={{ fontSize: 24 }} />,
      details: healthData ? `API ${healthData.status}` : 'Error de conexión'
    },
    {
      name: 'Base de Datos',
      status: healthData?.checks?.database?.status || 'unhealthy',
      description: 'PostgreSQL',
      icon: <DatabaseIcon sx={{ fontSize: 24 }} />,
      details: healthData?.checks?.database?.message || 'Sin conexión'
    },
    {
      name: 'Autenticación',
      status: healthData?.checks?.jwt?.status || 'unhealthy',
      description: 'JWT',
      icon: <LockIcon sx={{ fontSize: 24 }} />,
      details: healthData?.checks?.jwt?.message || 'JWT no configurado'
    },
    {
      name: 'AWS Environment',
      status: healthData?.checks?.aws?.status || 'unhealthy',
      description: 'AWS Configuration',
      icon: <CloudIcon sx={{ fontSize: 24 }} />,
      details: healthData?.checks?.aws?.message || 'AWS no configurado'
    },
    {
      name: 'Memoria',
      status: healthData?.checks?.memory?.status || 'unhealthy',
      description: 'Memory Usage',
      icon: <StorageIcon sx={{ fontSize: 24 }} />,
      details: healthData?.checks?.memory?.message || 'Memoria no disponible'
    }
  ]

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
        color: 'white',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          p: 3,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          🏥 Health Check
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
          Estado de salud del sistema u-control
        </Typography>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Grid container spacing={3} sx={{ maxWidth: '1200px', width: '100%' }}>
            
            {/* Health Status Overview */}
            <Grid item xs={12}>
              <Zoom in={true} timeout={500}>
                <Card elevation={8}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                      <HealthIcon color="primary" sx={{ fontSize: 28 }} />
                      <Typography variant="h5" component="h2">
                        Estado General del Sistema
                      </Typography>
                    </Stack>
                    
                    <Button
                      variant="contained"
                      onClick={checkHealth}
                      disabled={loading}
                      startIcon={loading ? <LinearProgress sx={{ width: 20, height: 20 }} /> : <RefreshIcon />}
                      fullWidth
                      sx={{ mb: 3 }}
                    >
                      {loading ? 'Verificando...' : 'Verificar Estado'}
                    </Button>

                    {lastChecked && (
                      <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
                        Última verificación: {lastChecked.toLocaleString()}
                      </Typography>
                    )}

                    {error && (
                      <Fade in={!!error}>
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <Typography variant="body2">{error}</Typography>
                        </Alert>
                      </Fade>
                    )}
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>

            {/* Health Checks Grid */}
            <Grid item xs={12}>
              <Zoom in={true} timeout={700}>
                <Card elevation={8}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                      <BuildIcon color="primary" sx={{ fontSize: 28 }} />
                      <Typography variant="h5" component="h2">
                        Verificaciones de Salud
                      </Typography>
                    </Stack>
                    
                    <Grid container spacing={2}>
                      {healthChecks.map((check, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Fade in={true} timeout={500 + index * 100}>
                            <Paper
                              elevation={2}
                              sx={{
                                p: 2,
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                                {check.icon}
                                <Typography variant="h6" sx={{ flex: 1 }}>
                                  {check.name}
                                </Typography>
                                <Chip
                                  icon={getStatusIcon(check.status)}
                                  label={check.status}
                                  color={getStatusColor(check.status)}
                                  size="small"
                                />
                              </Stack>
                              
                              <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                                {check.description}
                              </Typography>
                              
                              <Typography variant="body2" sx={{ fontSize: '0.875rem', opacity: 0.6 }}>
                                {check.details}
                              </Typography>
                            </Paper>
                          </Fade>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>

            {/* System Information */}
            {healthData && (
              <Grid item xs={12}>
                <Zoom in={true} timeout={900}>
                  <Card elevation={8}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                        <InfoIcon color="primary" sx={{ fontSize: 28 }} />
                        <Typography variant="h5" component="h2">
                          Información del Sistema
                        </Typography>
                      </Stack>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Paper
                            elevation={2}
                            sx={{
                              p: 2,
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <Typography variant="h6" gutterBottom>
                              Detalles de la API
                            </Typography>
                            <Stack spacing={1}>
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2">Servicio:</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {healthData.service}
                                </Typography>
                              </Box>
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2">Versión:</Typography>
                                <Chip label={healthData.version} size="small" />
                              </Box>
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2">Environment:</Typography>
                                <Chip label={healthData.environment} size="small" />
                              </Box>
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2">Timestamp:</Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                  {new Date(healthData.timestamp).toLocaleString()}
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Paper
                            elevation={2}
                            sx={{
                              p: 2,
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <Typography variant="h6" gutterBottom>
                              Estado de Servicios
                            </Typography>
                            <Stack spacing={1}>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2">Base de Datos:</Typography>
                                <Chip
                                  icon={getStatusIcon(healthData.checks?.database?.status)}
                                  label={healthData.checks?.database?.status || 'unhealthy'}
                                  color={getStatusColor(healthData.checks?.database?.status)}
                                  size="small"
                                />
                              </Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2">JWT:</Typography>
                                <Chip
                                  icon={getStatusIcon(healthData.checks?.jwt?.status)}
                                  label={healthData.checks?.jwt?.status || 'unhealthy'}
                                  color={getStatusColor(healthData.checks?.jwt?.status)}
                                  size="small"
                                />
                              </Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2">AWS:</Typography>
                                <Chip
                                  icon={getStatusIcon(healthData.checks?.aws?.status)}
                                  label={healthData.checks?.aws?.status || 'unhealthy'}
                                  color={getStatusColor(healthData.checks?.aws?.status)}
                                  size="small"
                                />
                              </Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2">Memoria:</Typography>
                                <Chip
                                  icon={getStatusIcon(healthData.checks?.memory?.status)}
                                  label={healthData.checks?.memory?.status || 'unhealthy'}
                                  color={getStatusColor(healthData.checks?.memory?.status)}
                                  size="small"
                                />
                              </Box>
                            </Stack>
                          </Paper>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            )}
          </Grid>
        </Box>
      </Container>

      {/* Footer */}
      <Paper
        elevation={0}
        sx={{
          background: 'rgba(0, 0, 0, 0.2)',
          p: 2,
          textAlign: 'center',
          mt: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Health Check - u-control System Monitoring
        </Typography>
      </Paper>
    </Box>
  )
}

export default HealthPage
