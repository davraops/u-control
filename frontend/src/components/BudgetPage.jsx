import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
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
  Paper,
  Stack,
  Fade,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  Divider,
} from '@mui/material'
import {
  AccountBalanceWallet as BudgetIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as ProgressIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  CalendarToday as CalendarIcon,
  MonetizationOn as MoneyIcon,
  PieChart as ChartIcon,
} from '@mui/icons-material'

const API_BASE_URL = 'https://e6itg7gvz6.execute-api.us-east-1.amazonaws.com/dev'

// Componente memoizado para las tarjetas de presupuesto
const BudgetCard = memo(({ budget, index, onEdit, onDelete, onSetDefault, getCategoryInfo, formatCurrency, formatMonth, getStatusInfo, getProgressColor }) => (
  <Grid item xs={12} md={6} lg={4} key={budget.id}>
    <Fade in={true} timeout={500 + index * 100}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" component="h3">
              {formatMonth(budget.month)}
            </Typography>
            {budget.isDefault && (
              <Chip
                label="Por Defecto"
                color="primary"
                size="small"
                icon={<CheckIcon />}
              />
            )}
          </Stack>
          <Chip
            label={getStatusInfo(budget.status)?.label || budget.status}
            color={getStatusInfo(budget.status)?.color || 'default'}
            size="small"
          />
        </Stack>

        <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
          Año: {budget.year}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Total Presupuestado: {formatCurrency(budget.totalBudgeted)}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Total Gastado: {formatCurrency(budget.totalSpent)}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Restante: {formatCurrency(budget.totalRemaining)}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Categorías:
        </Typography>
        <Box sx={{ mb: 2 }}>
          {budget.categories.slice(0, 3).map((category) => {
            const categoryInfo = getCategoryInfo(category.category)
            return (
              <Box key={category.category} sx={{ mb: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {categoryInfo?.icon} {categoryInfo?.label || category.category}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {formatCurrency(category.budgeted)}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(category.percentage || 0, 100)}
                  color={getProgressColor(category.percentage || 0)}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            )
          })}
          {budget.categories.length > 3 && (
            <Typography variant="body2" sx={{ fontSize: '0.75rem', opacity: 0.7 }}>
              +{budget.categories.length - 3} más...
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
          <IconButton
            size="small"
            onClick={() => onEdit(budget)}
          >
            <EditIcon />
          </IconButton>
          {!budget.isDefault && (
            <IconButton
              size="small"
              color="primary"
              onClick={() => onSetDefault(budget.id)}
              title="Establecer como presupuesto por defecto"
            >
              <CheckIcon />
            </IconButton>
          )}
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(budget.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Paper>
    </Fade>
  </Grid>
))

const BudgetPage = () => {
  const [budgets, setBudgets] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalBudgeted, setTotalBudgeted] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [totalRemaining, setTotalRemaining] = useState(0)
  const [availableCategories, setAvailableCategories] = useState([])
  const [availableStatuses, setAvailableStatuses] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    year: new Date().getFullYear(),
    categories: [],
    status: 'draft',
    isDefault: false
  })

  const getCategoryIcon = (category) => {
    const categoryInfo = availableCategories.find(cat => cat.value === category)
    return categoryInfo?.icon || '💰'
  }

  const getCategoryInfo = (category) => {
    return availableCategories.find(cat => cat.value === category)
  }

  const getStatusInfo = (status) => {
    return availableStatuses.find(s => s.value === status)
  }

  const formatCurrency = (amount, currency = 'COP') => {
    return `$${amount.toLocaleString()}`
  }

  const formatMonth = (monthString) => {
    const [year, month] = monthString.split('-')
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'error'
    if (percentage >= 80) return 'warning'
    return 'success'
  }

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/budgets`)
      const data = await response.json()

      setBudgets(data.budgets || [])
      setTotalBudgeted(data.totalBudgeted || 0)
      setTotalSpent(data.totalSpent || 0)
      setTotalRemaining(data.totalRemaining || 0)
      setAvailableCategories(data.availableCategories || [])
      setAvailableStatuses(data.availableStatuses || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts`)
      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
  }

  const handleCreateBudget = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      fetchBudgets()
      handleCloseDialog()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdateBudget = async () => {
    if (!editingBudget) return
    try {
      const response = await fetch(`${API_BASE_URL}/budgets/${editingBudget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      fetchBudgets()
      handleCloseDialog()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteBudget = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      fetchBudgets()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSetAsDefault = async (budgetId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/budgets/set-default`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ budgetId }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      fetchBudgets()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCreateFromDefault = async (targetMonth, targetYear) => {
    try {
      const response = await fetch(`${API_BASE_URL}/budgets/create-from-default?month=${targetMonth}&year=${targetYear}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      fetchBudgets()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleOpenDialog = useCallback((budget = null) => {
    if (budget) {
      setEditingBudget(budget)
      setFormData({
        month: budget.month,
        year: budget.year,
        categories: budget.categories || [],
        status: budget.status,
        isDefault: budget.isDefault || false
      })
    } else {
      resetForm()
    }
    setOpenDialog(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false)
    setEditingBudget(null)
    resetForm()
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      month: new Date().toISOString().slice(0, 7),
      year: new Date().getFullYear(),
      categories: [],
      status: 'draft',
      isDefault: false
    })
  }, [])

  const handleInputChange = useCallback((field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }, [])

  const handleCategoryToggle = useCallback((categoryValue) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryValue)
        ? prev.categories.filter(cat => cat !== categoryValue)
        : [...prev.categories, { category: categoryValue, budgeted: 0, spent: 0, remaining: 0, percentage: 0 }]
    }))
  }, [])

  const handleCategoryBudgetChange = useCallback((categoryValue, budgeted) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.category === categoryValue 
          ? { ...cat, budgeted: parseFloat(budgeted) || 0 }
          : cat
      )
    }))
  }, [])

  const getFilteredBudgets = useMemo(() => {
    let filtered = budgets

    if (selectedMonth !== '') {
      filtered = filtered.filter(budget => budget.month === selectedMonth)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(budget => budget.status === selectedStatus)
    }

    return filtered
  }, [budgets, selectedMonth, selectedStatus])

  const getTextFieldStyles = useMemo(() => ({
    '& .MuiOutlinedInput-root': {
      color: 'white',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#4ecdc4',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      '&.Mui-focused': {
        color: '#4ecdc4',
      },
    },
  }), [])

  const getSelectStyles = useMemo(() => ({
    color: 'white',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#4ecdc4',
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      '&.Mui-focused': {
        color: '#4ecdc4',
      },
    },
    '& .MuiSelect-icon': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
  }), [])

  useEffect(() => {
    fetchBudgets()
    fetchAccounts()
  }, [fetchBudgets])

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Grid container spacing={3} sx={{ maxWidth: '1200px', width: '100%' }}>
          {/* Header */}
          <Grid item xs={12}>
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
                💰 Presupuestos
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
                Gestiona tus presupuestos mensuales
              </Typography>
            </Paper>
          </Grid>

          {/* Summary Cards */}
          <Grid item xs={12}>
            <Zoom in={true} timeout={500}>
              <Card elevation={8}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                    <BudgetIcon color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h5" component="h2">
                      Resumen de Presupuestos
                    </Typography>
                  </Stack>

                  <Grid container spacing={2} mb={3}>
                    <Grid item xs={12} md={3}>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 2,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h4" color="primary" gutterBottom>
                          {budgets.length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Total Presupuestos
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 2,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h4" color="secondary" gutterBottom>
                          {formatCurrency(totalBudgeted)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Total Presupuestado
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 2,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h4" color="info" gutterBottom>
                          {formatCurrency(totalSpent)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Total Gastado
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 2,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h4" color="success" gutterBottom>
                          {formatCurrency(totalRemaining)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Total Restante
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Filters */}
          <Grid item xs={12}>
            <Zoom in={true} timeout={700}>
              <Card elevation={8}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                    <CalendarIcon color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h5" component="h2">
                      Filtros
                    </Typography>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Mes"
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={getTextFieldStyles}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth sx={getSelectStyles}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Estado</InputLabel>
                        <Select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          label="Estado"
                          sx={{ color: 'white' }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                                '& .MuiMenuItem-root': {
                                  color: 'white',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  },
                                  '&.Mui-selected': {
                                    backgroundColor: 'rgba(78, 205, 196, 0.2)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(78, 205, 196, 0.3)',
                                    },
                                  },
                                },
                              },
                            },
                          }}
                        >
                          <MenuItem value="all">Todos los estados</MenuItem>
                          {availableStatuses.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Budgets List */}
          <Grid item xs={12}>
            <Zoom in={true} timeout={900}>
              <Card elevation={8}>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <BudgetIcon color="primary" sx={{ fontSize: 28 }} />
                      <Typography variant="h5" component="h2">
                        Mis Presupuestos
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        startIcon={<CalendarIcon />}
                        onClick={() => {
                          const nextMonth = new Date();
                          nextMonth.setMonth(nextMonth.getMonth() + 1);
                          const monthString = nextMonth.toISOString().slice(0, 7);
                          const year = nextMonth.getFullYear();
                          handleCreateFromDefault(monthString, year);
                        }}
                      >
                        Crear desde Defecto
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                      >
                        Nuevo Presupuesto
                      </Button>
                    </Stack>
                  </Stack>

                  {loading && <LinearProgress sx={{ mb: 2 }} />}

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Grid container spacing={2}>
                    {getFilteredBudgets.map((budget, index) => (
                      <BudgetCard
                        key={budget.id}
                        budget={budget}
                        index={index}
                        onEdit={handleOpenDialog}
                        onDelete={handleDeleteBudget}
                        onSetDefault={handleSetAsDefault}
                        getCategoryInfo={getCategoryInfo}
                        formatCurrency={formatCurrency}
                        formatMonth={formatMonth}
                        getStatusInfo={getStatusInfo}
                        getProgressColor={getProgressColor}
                      />
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>
      </Box>

      {/* Add/Edit Budget Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }
        }}
        BackdropProps={{
          sx: {
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <DialogTitle sx={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 2
        }}>
          {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Mes"
              type="month"
              value={formData.month}
              onChange={handleInputChange('month')}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              sx={getTextFieldStyles}
            />

            <TextField
              label="Año"
              type="number"
              value={formData.year}
              onChange={handleInputChange('year')}
              fullWidth
              required
              sx={getTextFieldStyles}
            />

            <FormControl fullWidth sx={getSelectStyles}>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Estado</InputLabel>
              <Select
                value={formData.status}
                onChange={handleInputChange('status')}
                label="Estado"
                sx={{ color: 'white' }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                      '& .MuiMenuItem-root': {
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(78, 205, 196, 0.2)',
                          '&:hover': {
                            backgroundColor: 'rgba(78, 205, 196, 0.3)',
                          },
                        },
                      },
                    },
                  },
                }}
              >
                {availableStatuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  sx={{
                    color: '#4ecdc4',
                    '&.Mui-checked': {
                      color: '#4ecdc4',
                    },
                  }}
                />
              }
              label="Establecer como presupuesto por defecto"
              sx={{ color: 'white' }}
            />

            <Box>
              <Typography variant="h6" gutterBottom>
                Categorías de Presupuesto
              </Typography>
              <Grid container spacing={2}>
                {availableCategories.map((category) => (
                  <Grid item xs={12} sm={6} md={4} key={category.value}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        background: formData.categories.some(cat => cat.category === category.value)
                          ? 'rgba(78, 205, 196, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: formData.categories.some(cat => cat.category === category.value)
                          ? '1px solid rgba(78, 205, 196, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          background: 'rgba(78, 205, 196, 0.1)',
                        }
                      }}
                      onClick={() => handleCategoryToggle(category.value)}
                    >
                      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <Typography variant="h6">{category.icon}</Typography>
                        <Typography variant="body1">{category.label}</Typography>
                      </Stack>
                      {formData.categories.some(cat => cat.category === category.value) && (
                        <TextField
                          label="Presupuesto"
                          type="number"
                          value={formData.categories.find(cat => cat.category === category.value)?.budgeted || 0}
                          onChange={(e) => handleCategoryBudgetChange(category.value, e.target.value)}
                          fullWidth
                          size="small"
                          sx={getTextFieldStyles}
                        />
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          pt: 2,
          gap: 1
        }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={editingBudget ? handleUpdateBudget : handleCreateBudget}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #4ecdc4 30%, #44a08d 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #44a08d 30%, #4ecdc4 90%)',
              },
            }}
          >
            {editingBudget ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>
    </Container>
  )
}

export default BudgetPage
