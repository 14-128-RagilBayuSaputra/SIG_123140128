import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import api from '../services/api' 

function MapView() {
  const [geojsonData, setGeojsonData] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0) 
  const [modal, setModal] = useState({
    isOpen: false,
    mode: 'create', 
    data: { id: null, nama: '', jenis: 'Rumah Sakit', lat: 0, lng: 0 }
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/fasilitas/geojson/all')
        setGeojsonData(response.data)
      } catch (error) {
        console.error("Gagal mengambil data dari API:", error)
      }
    }
    fetchData()
  }, [refreshKey])
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        setModal({
          isOpen: true,
          mode: 'create',
          data: { id: null, nama: '', jenis: 'Rumah Sakit', lat: e.latlng.lat, lng: e.latlng.lng }
        })
      }
    })
    return null
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = {
      nama: modal.data.nama,
      jenis: modal.data.jenis,
      longitude: modal.data.lng,
      latitude: modal.data.lat
    }

    try {
      if (modal.mode === 'create') {
        await api.post('/fasilitas', payload)
        alert('Fasilitas berhasil ditambahkan!')
      } else {
        await api.put(`/fasilitas/${modal.data.id}`, payload)
        alert('Fasilitas berhasil diubah!')
      }
      setModal({ ...modal, isOpen: false }) 
      setRefreshKey(old => old + 1) 
    } catch (error) {
      alert('Gagal menyimpan data! Pastikan Anda sudah login.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus fasilitas ini?')) return

    try {
      await api.delete(`/fasilitas/${id}`)
      alert('Fasilitas berhasil dihapus!')
      setModal({ ...modal, isOpen: false }) 
      setRefreshKey(old => old + 1) 
    } catch (error) {
      alert('Gagal menghapus data! Pastikan Anda sudah login.')
    }
  }

  const pointToLayer = (feature, latlng) => {
    const jenis = feature.properties.jenis || ""
    let warna = "#808080" 

    if (jenis.toLowerCase().includes("rumah sakit") || jenis.toLowerCase().includes("kesehatan")) warna = "#E74C3C"
    else if (jenis.toLowerCase().includes("sekolah") || jenis.toLowerCase().includes("pendidikan")) warna = "#3498DB" 
    else if (jenis.toLowerCase().includes("olahraga")) warna = "#F39C12" 
    else if (jenis.toLowerCase().includes("ibadah") || jenis.toLowerCase().includes("masjid")) warna = "#2ECC71" 

    return L.circleMarker(latlng, {
      radius: 11, 
      fillColor: warna, 
      color: "#ffffff", 
      weight: 3, 
      opacity: 1, 
      fillOpacity: 0.9
    })
  }

  const onEachFeature = (feature, layer) => {
    layer.bindTooltip(
      `<div style="text-align: center;">
        <b>${feature.properties.nama}</b><br/>
        <span style="font-size: 11px; color: #7f8c8d;">${feature.properties.jenis}</span>
      </div>`,
      { direction: 'top', offset: [0, -10] }
    );

    layer.on({
      mouseover: (e) => {
        const target = e.target
        target.setStyle({ weight: 4, radius: 14, fillColor: '#f1c40f' }) 
      },
      mouseout: (e) => {
        const target = e.target
        target.setStyle(pointToLayer(feature, target.getLatLng()).options)
      },
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
        }
        setModal({
          isOpen: true,
          mode: 'edit',
          data: {
            id: feature.properties.id,
            nama: feature.properties.nama,
            jenis: feature.properties.jenis,
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0]
          }
        })
      }
    })
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer center={[-5.350, 105.300]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <MapClickHandler />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        {geojsonData && (
          <GeoJSON 
            key={refreshKey} 
            data={geojsonData} 
            pointToLayer={pointToLayer}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {modal.isOpen && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', width: '350px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
              {modal.mode === 'create' ? ' Tambah Fasilitas' : ' Edit Fasilitas'}
            </h3>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#34495e' }}>Nama Fasilitas</label>
                <input 
                  type="text" required 
                  value={modal.data.nama} 
                  onChange={e => setModal({ ...modal, data: { ...modal.data, nama: e.target.value } })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px', border: '1px solid #bdc3c7', boxSizing:'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#34495e' }}>Kategori / Jenis</label>
                <select 
                  value={modal.data.jenis} 
                  onChange={e => setModal({ ...modal, data: { ...modal.data, jenis: e.target.value } })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px', border: '1px solid #bdc3c7', boxSizing:'border-box' }}
                >
                  <option value="Rumah Sakit">Rumah Sakit / Kesehatan</option>
                  <option value="Sekolah">Sekolah / Pendidikan</option>
                  <option value="Olahraga">Fasilitas Olahraga</option>
                  <option value="Masjid">Tempat Ibadah (Masjid)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div style={{ fontSize: '12px', color: '#7f8c8d', backgroundColor: '#f1f2f6', padding: '8px', borderRadius: '5px' }}>
                Lokasi: {modal.data.lat.toFixed(5)}, {modal.data.lng.toFixed(5)}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Simpan</button>
                <button type="button" onClick={() => setModal({ ...modal, isOpen: false })} style={{ flex: 1, padding: '10px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Batal</button>
              </div>

              {modal.mode === 'edit' && (
                <button type="button" onClick={() => handleDelete(modal.data.id)} style={{ padding: '10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                   Hapus Fasilitas Ini
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView