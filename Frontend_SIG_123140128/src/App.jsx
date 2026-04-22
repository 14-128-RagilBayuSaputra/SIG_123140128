import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import MapView from './components/MapView'
import Login from './components/Login'
import './App.css'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const { user, logout } = useAuth()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#fdfdfd', fontFamily: 'sans-serif' }}>
      
      {user && (
        <header style={{ 
          backgroundColor: '#2c3e50', 
          color: 'white', 
          padding: '15px 30px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px' }}>🗺️ WebGIS Fasilitas Publik</h1>
            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#bdc3c7' }}>{user.email}</p>
          </div>
          <button 
            onClick={logout}
            style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Logout
          </button>
        </header>
      )}

      <main style={{ flex: 1, padding: user ? '20px' : '0' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.15)', border: '1px solid #ddd' }}>
                  <MapView />
                </div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

export default App