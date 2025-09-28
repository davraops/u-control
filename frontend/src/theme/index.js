import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4fc3f7',
      light: '#8bf6ff',
      dark: '#0091c4',
      contrastText: '#000000',
    },
    secondary: {
      main: '#ff6b6b',
      light: '#ff9e9e',
      dark: '#c73e1d',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0d1117',
      paper: 'rgba(255, 255, 255, 0.05)',
    },
    text: {
      primary: '#f0f6fc',
      secondary: 'rgba(240, 246, 252, 0.8)',
    },
    success: {
      main: '#00d4aa',
      light: '#4ddbb3',
      dark: '#00a085',
      contrastText: '#000000',
    },
    error: {
      main: '#ff4757',
      light: '#ff6b7a',
      dark: '#ff3742',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ffa502',
      light: '#ffb733',
      dark: '#ff9500',
      contrastText: '#000000',
    },
    info: {
      main: '#3742fa',
      light: '#5f6cfa',
      dark: '#2f3542',
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      background: 'linear-gradient(135deg, #4fc3f7 0%, #ff6b6b 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#4fc3f7',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#4fc3f7',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 500,
      color: '#f0f6fc',
      letterSpacing: '0',
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#f0f6fc',
      letterSpacing: '0',
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#f0f6fc',
      letterSpacing: '0.01em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 25,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
        },
        contained: {
          background: 'linear-gradient(45deg, #4fc3f7, #ff6b6b)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            background: 'linear-gradient(45deg, #ff6b6b, #4fc3f7)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #00d4aa, #4fc3f7)',
          color: '#000000',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(255, 255, 255, 0.3)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          height: 8,
        },
        bar: {
          borderRadius: 10,
        },
      },
    },
  },
});

export default theme;
