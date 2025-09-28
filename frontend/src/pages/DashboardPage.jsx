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
  Fade,
  Zoom,
  Paper,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Code as CodeIcon,
  Cloud as CloudIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
} from '@mui/icons-material'

const API_BASE_URL = 'https://e6itg7gvz6.execute-api.us-east-1.amazonaws.com/dev'

// Frontend version info
const FRONTEND_VERSION = {
  name: 'u-control-frontend',
  version: '1.0.0',
  description: 'Personal control application frontend',
  buildTime: new Date().toISOString(),
  environment: 'production'
}

const DashboardPage = () => {
  const [backendData, setBackendData] = useState(null)
  const [backendVersion, setBackendVersion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [versionLoading, setVersionLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchBackendData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/hello`)
      const data = await response.json()
      setBackendData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchBackendVersion = async () => {
    setVersionLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/version`)
      const data = await response.json()
      setBackendVersion(data)
    } catch (err) {
      console.error('Error fetching version:', err)
    } finally {
      setVersionLoading(false)
    }
  }

  useEffect(() => {
    fetchBackendData()
    fetchBackendVersion()
  }, [])

  return (
    <>
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
          🚀 u-control
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
          Tu aplicación personal de control
        </Typography>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Grid container spacing={3} sx={{ maxWidth: '1200px', width: '100%' }}>
            {/* Backend Connection Card */}
            <Grid item xs={12} md={6}>
              <Zoom in={true} timeout={500}>
                <Card elevation={8}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                      <CloudIcon color="primary" sx={{ fontSize: 28 }} />
                      <Typography variant="h5" component="h2">
                        Conexión Backend
                      </Typography>
                    </Stack>
                    
                    <Button
                      variant="contained"
                      onClick={fetchBackendData}
                      disabled={loading}
                      startIcon={loading ? <LinearProgress sx={{ width: 20, height: 20 }} /> : <RefreshIcon />}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      {loading ? 'Conectando...' : 'Probar Conexión'}
                    </Button>

                    {error && (
                      <Fade in={!!error}>
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <Typography variant="body2">{error}</Typography>
                        </Alert>
                      </Fade>
                    )}

                    {backendData && (
                      <Fade in={!!backendData}>
                        <Alert severity="success" sx={{ mb: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            ✅ Backend Conectado
                          </Typography>
                          <Stack spacing={1.5}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                              <Typography variant="body2" sx={{ minWidth: '80px' }}>Mensaje:</Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ textAlign: 'right', flex: 1, ml: 2 }}>
                                {backendData.message}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                              <Typography variant="body2" sx={{ minWidth: '80px' }}>Timestamp:</Typography>
                              <Typography variant="body2" sx={{ textAlign: 'right', flex: 1, ml: 2 }}>
                                {new Date(backendData.timestamp).toLocaleString()}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                              <Typography variant="body2" sx={{ minWidth: '80px' }}>Stage:</Typography>
                              <Box sx={{ flex: 1, ml: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Chip label={backendData.stage} size="small" />
                              </Box>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                              <Typography variant="body2" sx={{ minWidth: '80px' }}>Base de Datos:</Typography>
                              <Box sx={{ flex: 1, ml: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Chip
                                  icon={backendData.database?.connected ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <ErrorIcon sx={{ fontSize: 16 }} />}
                                  label={backendData.database?.connected ? 'Conectada' : 'Desconectada'}
                                  color={backendData.database?.connected ? 'success' : 'error'}
                                  size="small"
                                />
                              </Box>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                              <Typography variant="body2" sx={{ minWidth: '80px' }}>JWT:</Typography>
                              <Box sx={{ flex: 1, ml: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Chip
                                  icon={backendData.jwt?.secret === 'configured' ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <ErrorIcon sx={{ fontSize: 16 }} />}
                                  label={backendData.jwt?.secret === 'configured' ? 'Configurado' : 'No configurado'}
                                  color={backendData.jwt?.secret === 'configured' ? 'success' : 'error'}
                                  size="small"
                                />
                              </Box>
                            </Box>
                          </Stack>
                        </Alert>
                      </Fade>
                    )}
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>

            {/* System Status Card */}
            <Grid item xs={12} md={6}>
              <Zoom in={true} timeout={700}>
                <Card elevation={8}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                      <SpeedIcon color="primary" sx={{ fontSize: 28 }} />
                      <Typography variant="h5" component="h2">
                        Estado del Sistema
                      </Typography>
                    </Stack>
                    
                    <Stack spacing={2.5}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <CloudIcon color="info" sx={{ fontSize: 20 }} />
                        <Typography variant="body1">Frontend: Desplegado en S3</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <SpeedIcon color="primary" sx={{ fontSize: 20 }} />
                        <Typography variant="body1">Backend: AWS Lambda</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <StorageIcon color="secondary" sx={{ fontSize: 20 }} />
                        <Typography variant="body1">Base de Datos: PostgreSQL</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <SecurityIcon color="warning" sx={{ fontSize: 20 }} />
                        <Typography variant="body1">Autenticación: JWT</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>

            {/* Version Information Card */}
            <Grid item xs={12}>
              <Zoom in={true} timeout={900}>
                <Card elevation={8}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                      <BuildIcon color="primary" sx={{ fontSize: 28 }} />
                      <Typography variant="h5" component="h2">
                        Información de Versiones
                      </Typography>
                    </Stack>
                    
                    <Grid container spacing={3}>
                      {/* Frontend Version */}
                      <Grid item xs={12} md={6}>
                        <Paper
                          elevation={2}
                          sx={{
                            p: 2,
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                            <CodeIcon color="primary" sx={{ fontSize: 22 }} />
                            <Typography variant="h6">Frontend</Typography>
                          </Stack>
                          
                          <Stack spacing={1.5}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                              <Typography variant="body2" sx={{ minWidth: '80px' }}>Nombre:</Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ textAlign: 'right', flex: 1, ml: 2 }}>
                                {FRONTEND_VERSION.name}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                              <Typography variant="body2" sx={{ minWidth: '80px' }}>Versión:</Typography>
                              <Box sx={{ flex: 1, ml: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Chip label={`v${FRONTEND_VERSION.version}`} color="primary" size="small" />
                              </Box>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                              <Typography variant="body2" sx={{ minWidth: '80px' }}>Descripción:</Typography>
                              <Typography variant="body2" sx={{ textAlign: 'right', flex: 1, ml: 2 }}>
                                {FRONTEND_VERSION.description}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                              <Typography variant="body2" sx={{ minWidth: '80px' }}>Build Time:</Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.75rem', textAlign: 'right', flex: 1, ml: 2 }}>
                                {new Date(FRONTEND_VERSION.buildTime).toLocaleString()}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                              <Typography variant="body2" sx={{ minWidth: '80px' }}>Entorno:</Typography>
                              <Box sx={{ flex: 1, ml: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Chip label={FRONTEND_VERSION.environment} color="success" size="small" />
                              </Box>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>

                      {/* Backend Version */}
                      <Grid item xs={12} md={6}>
                        <Paper
                          elevation={2}
                          sx={{
                            p: 2,
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                            <CloudIcon color="primary" sx={{ fontSize: 22 }} />
                            <Typography variant="h6">Backend</Typography>
                          </Stack>
                          
                          {versionLoading ? (
                            <Box textAlign="center" py={2}>
                              <LinearProgress sx={{ mb: 1 }} />
                              <Typography variant="body2">Cargando información de versión...</Typography>
                            </Box>
                          ) : backendVersion ? (
                            <Stack spacing={1.5}>
                              <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                                <Typography variant="body2" sx={{ minWidth: '80px' }}>Servicio:</Typography>
                                <Typography variant="body2" fontWeight="bold" sx={{ textAlign: 'right', flex: 1, ml: 2 }}>
                                  {backendVersion.service}
                                </Typography>
                              </Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                                <Typography variant="body2" sx={{ minWidth: '80px' }}>Versión:</Typography>
                                <Box sx={{ flex: 1, ml: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                  <Chip label={`v${backendVersion.version}`} color="primary" size="small" />
                                </Box>
                              </Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                                <Typography variant="body2" sx={{ minWidth: '80px' }}>Descripción:</Typography>
                                <Typography variant="body2" sx={{ textAlign: 'right', flex: 1, ml: 2 }}>
                                  {backendVersion.description}
                                </Typography>
                              </Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                                <Typography variant="body2" sx={{ minWidth: '80px' }}>Stage:</Typography>
                                <Box sx={{ flex: 1, ml: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                  <Chip label={backendVersion.stage} color="success" size="small" />
                                </Box>
                              </Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                                <Typography variant="body2" sx={{ minWidth: '80px' }}>Región:</Typography>
                                <Typography variant="body2" sx={{ textAlign: 'right', flex: 1, ml: 2 }}>
                                  {backendVersion.environment.region}
                                </Typography>
                              </Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                                <Typography variant="body2" sx={{ minWidth: '80px' }}>Node.js:</Typography>
                                <Typography variant="body2" sx={{ textAlign: 'right', flex: 1, ml: 2 }}>
                                  {backendVersion.environment.node}
                                </Typography>
                              </Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                                <Typography variant="body2" sx={{ minWidth: '80px' }}>Build Time:</Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', textAlign: 'right', flex: 1, ml: 2 }}>
                                  {new Date(backendVersion.build.timestamp).toLocaleString()}
                                </Typography>
                              </Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                                <Typography variant="body2" sx={{ minWidth: '80px' }}>Git Commit:</Typography>
                                <Box sx={{ flex: 1, ml: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontFamily: 'monospace',
                                      fontSize: '0.75rem',
                                      background: 'rgba(0, 0, 0, 0.3)',
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1,
                                      border: '1px solid rgba(78, 205, 196, 0.3)',
                                    }}
                                  >
                                    {backendVersion.build.git.commit}
                                  </Typography>
                                </Box>
                              </Box>
                            </Stack>
                          ) : (
                            <Alert severity="error">
                              <Typography variant="body2">
                                No se pudo cargar la información de versión
                              </Typography>
                            </Alert>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
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
          Desarrollado con ❤️ usando React + Vite + Serverless + Material UI
        </Typography>
      </Paper>
    </>
  )
}

export default DashboardPage

