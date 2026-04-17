import MapView from './components/MapView'
import './App.css'

function App() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      backgroundColor: '#1e272e', 
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' 
    }}>
      {}
      <header style={{ 
        backgroundColor: '#2f3640', 
        color: '#f5f6fa', 
        padding: '20px 30px', 
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        zIndex: 1000 
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', letterSpacing: '1px' }}>📍 WebGIS Fasilitas Publik</h1>
          <p style={{ margin: '5px 0 0 0', color: '#7f8fa6', fontSize: '14px' }}>Kawasan Way Huwi & ITERA</p>
        </div>
        <div style={{ 
          backgroundColor: '#e1b12c', 
          color: '#2f3640', 
          padding: '8px 15px', 
          borderRadius: '20px', 
          fontWeight: 'bold', 
          fontSize: '13px',
          boxShadow: '0 2px 5px rgba(225, 177, 44, 0.4)'
        }}>
          Ragil Bayu (123140128)
        </div>
      </header>

      {}
      <main style={{ 
        flex: 1, 
        padding: '20px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <div style={{ 
          width: '100%', 
          height: '100%', 
          borderRadius: '15px', 
          overflow: 'hidden', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', 
          border: '3px solid #353b48' 
        }}>
          <MapView />
        </div>
      </main>
    </div>
  )
}

export default App