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
} from '@mui/material'
import {
  TrendingUp as IncomeIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MonetizationOn as SalaryIcon,
  Work as FreelanceIcon,
  ShowChart as InvestmentIcon,
  Business as BusinessIcon,
  AttachMoney as OtherIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as AccountIcon,
} from '@mui/icons-material'

const API_BASE_URL = 'https://e6itg7gvz6.execute-api.us-east-1.amazonaws.com/dev'

const IncomesPage = () => {
  const [incomes, setIncomes] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalAmount, setTotalAmount] = useState(0)
  const [categorySummary, setCategorySummary] = useState({})
  const [availableCategories, setAvailableCategories] = useState([])
  const [availablePatterns, setAvailablePatterns] = useState([])
  const [availableCurrencies, setAvailableCurrencies] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingIncome, setEditingIncome] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAccount, setSelectedAccount] = useState('all')

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'COP',
    description: '',
    category: 'salario',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    isRecurring: false,
    recurringPattern: 'monthly'
  })

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'salario': return <SalaryIcon />
      case 'freelance': return <FreelanceIcon />
      case 'inversion': return <InvestmentIcon />
      case 'negocio': return <BusinessIcon />
      case 'otro': return <OtherIcon />
      default: return <IncomeIcon />
    }
  }

  const getCategoryInfo = (category) => {
    return availableCategories.find(cat => cat.value === category)
  }

  const formatCurrency = (amount, currency = 'COP') => {
    const currencyInfo = availableCurrencies.find(c => c.value === currency)
    const symbol = currencyInfo?.symbol || '$'
    return `${symbol} ${amount.toLocaleString()}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  const fetchIncomes = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/incomes`)
      const data = await response.json()

      setIncomes(data.incomes || [])
      setTotalAmount(data.totalAmount || 0)
      setCategorySummary(data.categorySummary || {})
      setAvailableCategories(data.availableCategories || [])
      setAvailablePatterns(data.availablePatterns || [])
      setAvailableCurrencies(data.availableCurrencies || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts`)
      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
  }

  const handleCreateIncome = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/incomes`, {
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
      fetchIncomes()
      handleCloseDialog()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdateIncome = async () => {
    if (!editingIncome) return
    try {
      const response = await fetch(`${API_BASE_URL}/incomes/${editingIncome.id}`, {
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
      fetchIncomes()
      handleCloseDialog()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteIncome = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      fetchIncomes()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleOpenDialog = (income = null) => {
    if (income) {
      setEditingIncome(income)
      setFormData({
        amount: income.amount.toString(),
        currency: income.currency,
        description: income.description,
        category: income.category,
        accountId: income.accountId,
        date: income.date,
        tags: income.tags || [],
        isRecurring: income.isRecurring || false,
        recurringPattern: income.recurringPattern || 'monthly'
      })
    } else {
      resetForm()
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingIncome(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      currency: 'COP',
      description: '',
      category: 'salario',
      accountId: '',
      date: new Date().toISOString().split('T')[0],
      tags: [],
      isRecurring: false,
      recurringPattern: 'monthly'
    })
  }

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleCheckboxChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }))
  }

  const getFilteredIncomes = () => {
    let filtered = incomes

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(income => income.category === selectedCategory)
    }

    if (selectedAccount !== 'all') {
      filtered = filtered.filter(income => income.accountId === selectedAccount)
    }

    return filtered
  }

  const getTextFieldStyles = () => ({
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
  })

  const getSelectStyles = () => ({
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
  })

  useEffect(() => {
    fetchIncomes()
    fetchAccounts()
  }, [])

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
                💰 Ingresos
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
                Registra y gestiona todos tus ingresos
              </Typography>
            </Paper>
          </Grid>

          {/* Summary Cards */}
          <Grid item xs={12}>
            <Zoom in={true} timeout={500}>
              <Card elevation={8}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                    <IncomeIcon color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h5" component="h2">
                      Resumen de Ingresos
                    </Typography>
                  </Stack>

                  <Grid container spacing={2} mb={3}>
                    <Grid item xs={12} md={4}>
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
                          {incomes.length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Total de Ingresos
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
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
                          {formatCurrency(totalAmount)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Monto Total
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
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
                          {incomes.filter(inc => inc.isRecurring).length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Ingresos Recurrentes
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Category Summary */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Resumen por Categoría:
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(categorySummary).map(([category, data]) => {
                        const categoryInfo = getCategoryInfo(category)
                        return (
                          <Grid item xs={12} sm={6} md={3} key={category}>
                            <Paper
                              elevation={2}
                              sx={{
                                p: 2,
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                textAlign: 'center',
                              }}
                            >
                              <Typography variant="h6" color={categoryInfo?.color || 'primary'} gutterBottom>
                                {categoryInfo ? `${categoryInfo.icon} ${categoryInfo.label}` : category}
                              </Typography>
                              <Typography variant="h4" color="primary" gutterBottom>
                                {data.count}
                              </Typography>
                              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Ingresos
                              </Typography>
                              <Typography variant="body2" sx={{ opacity: 0.6 }}>
                                {formatCurrency(data.total)}
                              </Typography>
                            </Paper>
                          </Grid>
                        )
                      })}
                    </Grid>
                  </Box>
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
                      <FormControl fullWidth sx={getSelectStyles()}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Categoría</InputLabel>
                        <Select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          label="Categoría"
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
                          <MenuItem value="all">Todas las categorías</MenuItem>
                          {availableCategories.map((category) => (
                            <MenuItem key={category.value} value={category.value}>
                              {category.icon} {category.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth sx={getSelectStyles()}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Cuenta</InputLabel>
                        <Select
                          value={selectedAccount}
                          onChange={(e) => setSelectedAccount(e.target.value)}
                          label="Cuenta"
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
                          <MenuItem value="all">Todas las cuentas</MenuItem>
                          {accounts.map((account) => (
                            <MenuItem key={account.id} value={account.id}>
                              {account.name}
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

          {/* Incomes Table */}
          <Grid item xs={12}>
            <Zoom in={true} timeout={900}>
              <Card elevation={8}>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <IncomeIcon color="primary" sx={{ fontSize: 28 }} />
                      <Typography variant="h5" component="h2">
                        Lista de Ingresos
                      </Typography>
                    </Stack>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog()}
                    >
                      Nuevo Ingreso
                    </Button>
                  </Stack>

                  {loading && <LinearProgress sx={{ mb: 2 }} />}

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <TableContainer component={Paper} sx={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Descripción</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Categoría</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Monto</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cuenta</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Recurrente</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getFilteredIncomes().map((income, index) => (
                          <TableRow key={income.id}>
                            <TableCell sx={{ color: 'white' }}>{income.description}</TableCell>
                            <TableCell sx={{ color: 'white' }}>
                              <Chip
                                icon={getCategoryIcon(income.category)}
                                label={getCategoryInfo(income.category)?.label || income.category}
                                color={getCategoryInfo(income.category)?.color || 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                              {formatCurrency(income.amount, income.currency)}
                            </TableCell>
                            <TableCell sx={{ color: 'white' }}>{formatDate(income.date)}</TableCell>
                            <TableCell sx={{ color: 'white' }}>
                              {accounts.find(acc => acc.id === income.accountId)?.name || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ color: 'white' }}>
                              {income.isRecurring ? (
                                <Chip
                                  label={income.recurringPattern}
                                  color="success"
                                  size="small"
                                />
                              ) : (
                                <Chip
                                  label="No"
                                  color="default"
                                  size="small"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(income)}
                                >
                                  <EditIcon sx={{ color: 'white' }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteIncome(income.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>
      </Box>

      {/* Add/Edit Income Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
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
          {editingIncome ? 'Editar Ingreso' : 'Nuevo Ingreso'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Descripción"
              value={formData.description}
              onChange={handleInputChange('description')}
              fullWidth
              required
              sx={getTextFieldStyles()}
            />

            <FormControl fullWidth sx={getSelectStyles()}>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Categoría</InputLabel>
              <Select
                value={formData.category}
                onChange={handleInputChange('category')}
                label="Categoría"
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
                {availableCategories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Monto"
              type="number"
              value={formData.amount}
              onChange={handleInputChange('amount')}
              fullWidth
              required
              sx={getTextFieldStyles()}
            />

            <FormControl fullWidth sx={getSelectStyles()}>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Moneda</InputLabel>
              <Select
                value={formData.currency}
                onChange={handleInputChange('currency')}
                label="Moneda"
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
                {availableCurrencies.map((currency) => (
                  <MenuItem key={currency.value} value={currency.value}>
                    {currency.symbol} {currency.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={getSelectStyles()}>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Cuenta de destino</InputLabel>
              <Select
                value={formData.accountId}
                onChange={handleInputChange('accountId')}
                label="Cuenta de destino"
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
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Fecha"
              type="date"
              value={formData.date}
              onChange={handleInputChange('date')}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              sx={getTextFieldStyles()}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isRecurring}
                  onChange={handleCheckboxChange('isRecurring')}
                  sx={{
                    color: '#4ecdc4',
                    '&.Mui-checked': {
                      color: '#4ecdc4',
                    },
                  }}
                />
              }
              label="Ingreso recurrente"
              sx={{ color: 'white' }}
            />

            {formData.isRecurring && (
              <FormControl fullWidth sx={getSelectStyles()}>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Patrón de recurrencia</InputLabel>
                <Select
                  value={formData.recurringPattern}
                  onChange={handleInputChange('recurringPattern')}
                  label="Patrón de recurrencia"
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
                  {availablePatterns.map((pattern) => (
                    <MenuItem key={pattern.value} value={pattern.value}>
                      {pattern.icon} {pattern.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
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
            onClick={editingIncome ? handleUpdateIncome : handleCreateIncome}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #4ecdc4 30%, #44a08d 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #44a08d 30%, #4ecdc4 90%)',
              },
            }}
          >
            {editingIncome ? 'Actualizar' : 'Crear'}
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

export default IncomesPage


