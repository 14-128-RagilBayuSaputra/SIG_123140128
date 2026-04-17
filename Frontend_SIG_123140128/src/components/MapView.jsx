import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'

function MapView() {
  const [geojsonData, setGeojsonData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/fasilitas/geojson/all')
        setGeojsonData(response.data)
      } catch (error) {
        console.error("Gagal mengambil data dari API:", error)
      }
    }
    fetchData()
  }, [])

  const pointToLayer = (feature, latlng) => {
    const jenis = feature.properties.jenis || ""
    let warna = "#808080" 

    if (jenis.toLowerCase().includes("rumah sakit")) warna = "#E74C3C"
    else if (jenis.toLowerCase().includes("sekolah")) warna = "#3498DB" 
    else if (jenis.toLowerCase().includes("olahraga")) warna = "#F39C12" 
    else if (jenis.toLowerCase().includes("ibadah")) warna = "#2ECC71" 

    return L.circleMarker(latlng, {
      radius: 8,
      fillColor: warna,
      color: "#ffffff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    })
  }

  const onEachFeature = (feature, layer) => {
    const { nama, jenis, alamat } = feature.properties
    
    layer.bindPopup(`
      <div style="font-family: sans-serif; text-align: center;">
        <h3 style="margin: 0 0 5px 0; color: #2c3e50;">${nama}</h3>
        <span style="background-color: #ecf0f1; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; color: #34495e;">${jenis}</span>
        <p style="margin: 8px 0 0 0; font-size: 13px;">${alamat || 'Alamat belum tersedia'}</p>
      </div>
    `)

    layer.on({
      mouseover: (e) => {
        const target = e.target
        target.setStyle({ weight: 4, radius: 12, fillColor: '#f1c40f' }) 
      },
      mouseout: (e) => {
        const target = e.target
        target.setStyle(pointToLayer(feature, target.getLatLng()).options)
      }
    })
  }

return (
    <MapContainer center={[-5.350, 105.300]} zoom={15} style={{ height: '100%', width: '100%' }}>
      
      {}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {geojsonData && (
        <GeoJSON 
          data={geojsonData} 
          pointToLayer={pointToLayer}
          onEachFeature={onEachFeature}
        />
      )}
    </MapContainer>
  )
}

export default MapView