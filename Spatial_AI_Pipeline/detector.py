import cv2
from ultralytics import YOLO
import rasterio
import json
import asyncpg
import asyncio
import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'Backend_SIG_123140128', '.env')
load_dotenv(dotenv_path)

DB_CONFIG = {
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD"), 
    "database": os.getenv("DB_NAME", "sig_123140128"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432")
}

def detect_large_image(image_path, model, tile_size=640):
    print(f"Membaca citra {image_path}...")
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Gambar tidak ditemukan! Pastikan path benar.")
        
    h, w = img.shape[:2]
    all_detections = []
    
    print("Memulai proses tiling dan deteksi YOLOv8...")
    for y in range(0, h, tile_size):
        for x in range(0, w, tile_size):
            tile = img[y:y+tile_size, x:x+tile_size]
            
            if tile.shape[0] < 100 or tile.shape[1] < 100:
                continue
                
            results = model(tile, verbose=False)
            
            for box in results[0].boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                
                if conf > 0.5:
                    all_detections.append({
                        'bbox': [x1+x, y1+y, x2+x, y2+y],
                        'class_name': model.names[cls_id],
                        'confidence': conf
                    })
    return all_detections

def pixel_to_geo(image_path, detections):
    print("Mengonversi piksel ke koordinat geografis (Lat/Lon)...")
    with rasterio.open(image_path) as src:
        transform = src.transform
        
        geo_detections = []
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2
            
            lon, lat = transform * (cx, cy)
            
            geo_detections.append({
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lon, lat]
                },
                'properties': {
                    'nama': f"Objek AI: {det['class_name'].capitalize()}",
                    'jenis': 'Lainnya', 
                    'confidence': det['confidence']
                }
            })
        return geo_detections

def export_to_geojson(geo_detections, output_path):
    print("Mengekspor hasil ke format GeoJSON...")
    geojson = {
        'type': 'FeatureCollection',
        'features': []
    }
    
    for det in geo_detections:
        feature = {
            'type': 'Feature',
            'geometry': det['geometry'],
            'properties': det['properties']
        }
        geojson['features'].append(feature)
        
    with open(output_path, 'w') as f:
        json.dump(geojson, f, indent=2)
    print(f"File {output_path} berhasil dibuat dengan {len(geo_detections)} deteksi!")

async def save_to_postgis(geo_detections):
    print("Menyuntikkan data AI ke PostGIS...")
    conn = await asyncpg.connect(**DB_CONFIG)
    
    try:
        count = 0
        for det in geo_detections:
            coords = det['geometry']['coordinates']
            props = det['properties']
            
            await conn.execute("""
                INSERT INTO fasilitas_publik (nama, jenis, geom)
                VALUES ($1, $2, ST_SetSRID(ST_Point($3, $4), 4326))
            """, props['nama'], props['jenis'], coords[0], coords[1])
            count += 1
            
        print(f"Berhasil menyimpan {count} titik AI ke tabel fasilitas_publik!")
    finally:
        await conn.close()

async def main():
    IMAGE_PATH = 'citra_udara.tif' 
    
    print("Memuat model YOLOv8...")
    model = YOLO('yolov8n.pt') 
    
    try:
        pixel_detections = detect_large_image(IMAGE_PATH, model)
        geo_detections = pixel_to_geo(IMAGE_PATH, pixel_detections)
        export_to_geojson(geo_detections, 'hasil_deteksi_ai.geojson')
        
        await save_to_postgis(geo_detections)
        print("PIPELINE SELESAI! Silakan buka WebGIS kamu.")
        
    except Exception as e:
        print(f"Terjadi kesalahan: {e}")

if __name__ == "__main__":
    asyncio.run(main())