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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Paper,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
  AttachMoney as CashIcon,
  CreditCard as CreditIcon,
  TrendingUp as InvestmentIcon,
  Savings as SavingsIcon,
  AccountBalanceWallet as WalletIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
} from '@mui/icons-material'

const API_BASE_URL = 'https://e6itg7gvz6.execute-api.us-east-1.amazonaws.com/dev'

const FinancePage = () => {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalBalance, setTotalBalance] = useState(0)
  const [tagSummary, setTagSummary] = useState({})
  const [availableTags, setAvailableTags] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [showBalances, setShowBalances] = useState(true)
  const [selectedTag, setSelectedTag] = useState('all')

  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    bank: '',
    accountNumber: '',
    balance: '',
    currency: 'COP',
    tags: []
  })

  const accountTypes = [
    { value: 'checking', label: 'Cuenta Corriente', icon: '🏦' },
    { value: 'savings', label: 'Cuenta de Ahorros', icon: '💰' },
    { value: 'investment', label: 'Inversión', icon: '📈' },
    { value: 'cash', label: 'Efectivo', icon: '💵' },
    { value: 'credit', label: 'Tarjeta de Crédito', icon: '💳' }
  ]

  const currencies = [
    { value: 'COP', label: 'Peso Colombiano', symbol: '$' },
    { value: 'USD', label: 'Dólar Americano', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'MXN', label: 'Peso Mexicano', symbol: '$' },
    { value: 'ARS', label: 'Peso Argentino', symbol: '$' }
  ]

  const getAccountIcon = (type) => {
    switch (type) {
      case 'checking': return <BankIcon />
      case 'savings': return <SavingsIcon />
      case 'investment': return <InvestmentIcon />
      case 'cash': return <CashIcon />
      case 'credit': return <CreditIcon />
      default: return <WalletIcon />
    }
  }

  const getAccountColor = (type) => {
    switch (type) {
      case 'checking': return 'primary'
      case 'savings': return 'success'
      case 'investment': return 'warning'
      case 'cash': return 'info'
      case 'credit': return 'error'
      default: return 'default'
    }
  }

  const formatCurrency = (amount, currency = 'COP') => {
    const currencyInfo = currencies.find(c => c.value === currency)
    const symbol = currencyInfo?.symbol || '$'
    return `${symbol} ${amount.toLocaleString()}`
  }

  const fetchAccounts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/accounts`)
      const data = await response.json()
      
      setAccounts(data.accounts || [])
      setTotalBalance(data.totalBalance || 0)
      setTagSummary(data.tagSummary || {})
      setAvailableTags(data.availableTags || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchAccounts()
        handleCloseDialog()
        resetForm()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Error al crear cuenta')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdateAccount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchAccounts()
        handleCloseDialog()
        resetForm()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Error al actualizar cuenta')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cuenta?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchAccounts()
        } else {
          const errorData = await response.json()
          setError(errorData.message || 'Error al eliminar cuenta')
        }
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleOpenDialog = (account = null) => {
    if (account) {
      setEditingAccount(account)
      setFormData({
        name: account.name,
        type: account.type,
        bank: account.bank || '',
        accountNumber: account.accountNumber || '',
        balance: account.balance.toString(),
        currency: account.currency,
        tags: account.tags || []
      })
    } else {
      resetForm()
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingAccount(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'checking',
      bank: '',
      accountNumber: '',
      balance: '',
      currency: 'COP',
      tags: []
    })
  }

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleTagToggle = (tagValue) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagValue)
        ? prev.tags.filter(tag => tag !== tagValue)
        : [...prev.tags, tagValue]
    }))
  }

  const getTagInfo = (tagValue) => {
    return availableTags.find(tag => tag.value === tagValue)
  }

  const getFilteredAccounts = () => {
    if (selectedTag === 'all') {
      return accounts
    }
    return accounts.filter(account => account.tags.includes(selectedTag))
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
    '& .MuiPaper-root': {
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    },
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

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
          💰 Finanzas
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
          Gestión de cuentas bancarias y efectivo
        </Typography>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Grid container spacing={3} sx={{ maxWidth: '1200px', width: '100%' }}>
            
            {/* Summary Card */}
            <Grid item xs={12}>
              <Zoom in={true} timeout={500}>
                <Card elevation={8}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <WalletIcon color="primary" sx={{ fontSize: 28 }} />
                        <Typography variant="h5" component="h2">
                          Resumen Financiero
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => setShowBalances(!showBalances)}>
                          {showBalances ? <HideIcon /> : <ViewIcon />}
                        </IconButton>
                        <IconButton onClick={fetchAccounts}>
                          <RefreshIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                    
                    <Grid container spacing={3}>
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
                            {accounts.length}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Total de Cuentas
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
                          <Typography variant="h4" color="success" gutterBottom>
                            {showBalances ? formatCurrency(totalBalance) : '***'}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Balance Total
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
                            {accounts.filter(acc => acc.type === 'cash').length}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Cuentas de Efectivo
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Tag Summary */}
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Resumen por Categorías:
                      </Typography>
                      <Grid container spacing={2}>
                        {Object.entries(tagSummary).map(([tag, data]) => {
                          const tagInfo = getTagInfo(tag)
                          return (
                            <Grid item xs={12} sm={6} md={3} key={tag}>
                              <Paper
                                elevation={2}
                                sx={{
                                  p: 2,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  textAlign: 'center',
                                }}
                              >
                                <Typography variant="h6" color={tagInfo?.color || 'primary'} gutterBottom>
                                  {tagInfo ? `${tagInfo.icon} ${tagInfo.label}` : tag}
                                </Typography>
                                <Typography variant="h4" color="primary" gutterBottom>
                                  {data.count}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                  Cuentas
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.6 }}>
                                  {showBalances ? formatCurrency(data.balance) : '***'}
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

            {/* Accounts Grid */}
            <Grid item xs={12}>
              <Zoom in={true} timeout={700}>
                <Card elevation={8}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <BankIcon color="primary" sx={{ fontSize: 28 }} />
                        <Typography variant="h5" component="h2">
                          Mis Cuentas
                        </Typography>
                      </Stack>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                      >
                        Nueva Cuenta
                      </Button>
                    </Stack>

                    {/* Tag Filter */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Filtrar por categoría:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                          label="Todas"
                          onClick={() => setSelectedTag('all')}
                          color={selectedTag === 'all' ? 'primary' : 'default'}
                          variant={selectedTag === 'all' ? 'filled' : 'outlined'}
                        />
                        {availableTags.map((tag) => (
                          <Chip
                            key={tag.value}
                            label={`${tag.icon} ${tag.label}`}
                            onClick={() => setSelectedTag(tag.value)}
                            color={selectedTag === tag.value ? tag.color : 'default'}
                            variant={selectedTag === tag.value ? 'filled' : 'outlined'}
                          />
                        ))}
                      </Stack>
                    </Box>

                    {loading && <LinearProgress sx={{ mb: 2 }} />}

                    {error && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                      </Alert>
                    )}

                    <Grid container spacing={2}>
                      {getFilteredAccounts().map((account, index) => (
                        <Grid item xs={12} sm={6} md={4} key={account.id}>
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
                              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  {getAccountIcon(account.type)}
                                  <Typography variant="h6" sx={{ flex: 1 }}>
                                    {account.name}
                                  </Typography>
                                </Stack>
                                <Chip
                                  label={accountTypes.find(t => t.value === account.type)?.label}
                                  color={getAccountColor(account.type)}
                                  size="small"
                                />
                              </Stack>

                              <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                                {account.bank || 'Efectivo'}
                              </Typography>

                              {account.accountNumber && (
                                <Typography variant="body2" sx={{ mb: 1, opacity: 0.6 }}>
                                  {account.accountNumber}
                                </Typography>
                              )}

                              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                                {showBalances ? formatCurrency(account.balance, account.currency) : '***'}
                              </Typography>

                              {/* Tags */}
                              <Box sx={{ mb: 2 }}>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                  {account.tags.map((tag) => {
                                    const tagInfo = getTagInfo(tag)
                                    return (
                                      <Chip
                                        key={tag}
                                        label={tagInfo ? `${tagInfo.icon} ${tagInfo.label}` : tag}
                                        size="small"
                                        color={tagInfo?.color || 'default'}
                                        variant="outlined"
                                      />
                                    )
                                  })}
                                </Stack>
                              </Box>

                              <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(account)}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteAccount(account.id)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Stack>
                            </Paper>
                          </Fade>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Add/Edit Account Dialog */}
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
          {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nombre de la cuenta"
              value={formData.name}
              onChange={handleInputChange('name')}
              fullWidth
              required
              sx={getTextFieldStyles()}
            />

            <FormControl fullWidth sx={getSelectStyles()}>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Tipo de cuenta</InputLabel>
              <Select
                value={formData.type}
                onChange={handleInputChange('type')}
                label="Tipo de cuenta"
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
                {accountTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.type !== 'cash' && (
              <TextField
                label="Banco"
                value={formData.bank}
                onChange={handleInputChange('bank')}
                fullWidth
                required
                sx={getTextFieldStyles()}
              />
            )}

            {formData.type !== 'cash' && (
              <TextField
                label="Número de cuenta"
                value={formData.accountNumber}
                onChange={handleInputChange('accountNumber')}
                fullWidth
                sx={getTextFieldStyles()}
              />
            )}

            <TextField
              label="Saldo inicial"
              type="number"
              value={formData.balance}
              onChange={handleInputChange('balance')}
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
                {currencies.map((currency) => (
                  <MenuItem key={currency.value} value={currency.value}>
                    {currency.symbol} {currency.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="h6" gutterBottom>
                Categorías (Tags)
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {availableTags.map((tag) => (
                  <Chip
                    key={tag.value}
                    label={`${tag.icon} ${tag.label}`}
                    onClick={() => handleTagToggle(tag.value)}
                    color={formData.tags.includes(tag.value) ? tag.color : 'default'}
                    variant={formData.tags.includes(tag.value) ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
              {formData.tags.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
                  Seleccionadas: {formData.tags.length} categoría(s)
                </Typography>
              )}
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
            onClick={editingAccount ? handleUpdateAccount : handleCreateAccount}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #4ecdc4 30%, #44a08d 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #44a08d 30%, #4ecdc4 90%)',
              },
            }}
          >
            {editingAccount ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>
    </Box>
  )
}

export default FinancePage
