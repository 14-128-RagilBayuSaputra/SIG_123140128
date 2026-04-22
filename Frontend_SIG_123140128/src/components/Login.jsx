import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault() 
    setError('')
    setIsLoading(true)

    try {
      await login(email, password) 
      navigate('/') 
    } catch (err) {
      setError('Email atau Password salah!') 
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#ecf0f1' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '24px' }}>WebGIS Login</h2>
          <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>Silakan masuk untuk mengelola peta</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#ff7675', color: 'white', padding: '10px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#34495e', fontWeight: 'bold' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bdc3c7', boxSizing: 'border-box', fontSize: '14px' }}
              placeholder="ragil@itera.ac.id"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#34495e', fontWeight: 'bold' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bdc3c7', boxSizing: 'border-box', fontSize: '14px' }}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              backgroundColor: isLoading ? '#95a5a6' : '#2980b9', 
              color: 'white', 
              padding: '12px', 
              borderRadius: '6px', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              fontSize: '16px'
            }}
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login