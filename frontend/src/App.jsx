import { useState, useEffect } from 'react'
import './App.css'

const API_BASE_URL = 'https://e6itg7gvz6.execute-api.us-east-1.amazonaws.com/dev'

function App() {
  const [backendData, setBackendData] = useState(null)
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    fetchBackendData()
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
      </main>

      <footer className="app-footer">
        <p>Desarrollado con ❤️ usando React + Vite + Serverless</p>
      </footer>
    </div>
  )
}

export default App
