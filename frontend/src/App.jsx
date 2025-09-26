import { useState, useEffect } from 'react'
import './App.css'

const API_BASE_URL = 'https://e6itg7gvz6.execute-api.us-east-1.amazonaws.com/dev'

// Frontend version info
const FRONTEND_VERSION = {
  name: 'u-control-frontend',
  version: '1.0.0',
  description: 'Personal control application frontend',
  buildTime: new Date().toISOString(),
  environment: 'production'
}

function App() {
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
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
    <div className="app">
      <header className="app-header">
        <h1>🚀 u-control</h1>
        <p>Tu aplicación personal de control</p>
      </header>

      <main className="app-main">
        <div className="card">
          <h2>🔗 Conexión Backend</h2>
          <button 
            onClick={fetchBackendData} 
            disabled={loading}
            className="fetch-button"
          >
            {loading ? '🔄 Conectando...' : '🔄 Probar Conexión'}
          </button>

          {error && (
            <div className="error">
              <h3>❌ Error:</h3>
              <p>{error}</p>
            </div>
          )}

          {backendData && (
            <div className="success">
              <h3>✅ Backend Conectado</h3>
              <div className="data-grid">
                <div className="data-item">
                  <strong>Mensaje:</strong> {backendData.message}
                </div>
                <div className="data-item">
                  <strong>Timestamp:</strong> {new Date(backendData.timestamp).toLocaleString()}
                </div>
                <div className="data-item">
                  <strong>Stage:</strong> {backendData.stage}
                </div>
                <div className="data-item">
                  <strong>Base de Datos:</strong> 
                  <span className={backendData.database?.connected ? 'status-success' : 'status-error'}>
                    {backendData.database?.connected ? '✅ Conectada' : '❌ Desconectada'}
                  </span>
                </div>
                <div className="data-item">
                  <strong>JWT:</strong> 
                  <span className={backendData.jwt?.secret === 'configured' ? 'status-success' : 'status-error'}>
                    {backendData.jwt?.secret === 'configured' ? '✅ Configurado' : '❌ No configurado'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>📊 Estado del Sistema</h2>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-icon">🌐</span>
              <span>Frontend: Desplegado en S3</span>
            </div>
            <div className="status-item">
              <span className="status-icon">⚡</span>
              <span>Backend: AWS Lambda</span>
            </div>
            <div className="status-item">
              <span className="status-icon">🗄️</span>
              <span>Base de Datos: PostgreSQL</span>
            </div>
            <div className="status-item">
              <span className="status-icon">🔐</span>
              <span>Autenticación: JWT</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>📦 Información de Versiones</h2>
          
          {/* Frontend Version */}
          <div className="version-section">
            <h3>🖥️ Frontend</h3>
            <div className="version-info">
              <div className="version-item">
                <strong>Nombre:</strong> {FRONTEND_VERSION.name}
              </div>
              <div className="version-item">
                <strong>Versión:</strong> 
                <span className="version-badge">v{FRONTEND_VERSION.version}</span>
              </div>
              <div className="version-item">
                <strong>Descripción:</strong> {FRONTEND_VERSION.description}
              </div>
              <div className="version-item">
                <strong>Build Time:</strong> {new Date(FRONTEND_VERSION.buildTime).toLocaleString()}
              </div>
              <div className="version-item">
                <strong>Entorno:</strong> 
                <span className="status-success">{FRONTEND_VERSION.environment}</span>
              </div>
            </div>
          </div>

          {/* Backend Version */}
          <div className="version-section">
            <h3>⚡ Backend</h3>
            {versionLoading ? (
              <div className="loading">🔄 Cargando información de versión...</div>
            ) : backendVersion ? (
              <div className="version-info">
                <div className="version-item">
                  <strong>Servicio:</strong> {backendVersion.service}
                </div>
                <div className="version-item">
                  <strong>Versión:</strong> 
                  <span className="version-badge">v{backendVersion.version}</span>
                </div>
                <div className="version-item">
                  <strong>Descripción:</strong> {backendVersion.description}
                </div>
                <div className="version-item">
                  <strong>Stage:</strong> 
                  <span className="status-success">{backendVersion.stage}</span>
                </div>
                <div className="version-item">
                  <strong>Región:</strong> {backendVersion.environment.region}
                </div>
                <div className="version-item">
                  <strong>Node.js:</strong> {backendVersion.environment.node}
                </div>
                <div className="version-item">
                  <strong>Build Time:</strong> {new Date(backendVersion.build.timestamp).toLocaleString()}
                </div>
                <div className="version-item">
                  <strong>Git Commit:</strong> 
                  <code className="git-commit">{backendVersion.build.git.commit}</code>
                </div>
              </div>
            ) : (
              <div className="error">❌ No se pudo cargar la información de versión</div>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Desarrollado con ❤️ usando React + Vite + Serverless</p>
      </footer>
    </div>
  )
}

export default App
