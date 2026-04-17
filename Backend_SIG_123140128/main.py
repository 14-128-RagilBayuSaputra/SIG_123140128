from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncpg
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="API Fasilitas Publik - Ragil Bayu Saputra",
    description="REST API Integrasi PostGIS untuk data fasilitas publik milik Ragil",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD"), 
    "database": os.getenv("DB_NAME", "sig_123140128"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432")
}

class FasilitasInput(BaseModel):
    nama: str
    jenis: str
    longitude: float
    latitude: float

async def get_db_connection():
    return await asyncpg.connect(**DB_CONFIG)

@app.get("/fasilitas", tags=["Fasilitas"])
async def get_all_fasilitas():
    conn = await get_db_connection()
    try:
        query = "SELECT id, nama, jenis FROM fasilitas_publik"
        rows = await conn.fetch(query)
        return {"data": [dict(row) for row in rows]}
    finally:
        await conn.close()

@app.get("/fasilitas/{fasilitas_id}", tags=["Fasilitas"])
async def get_fasilitas_by_id(fasilitas_id: int):
    conn = await get_db_connection()
    try:
        query = "SELECT id, nama, jenis FROM fasilitas_publik WHERE id = $1"
        row = await conn.fetchrow(query, fasilitas_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
        return dict(row)
    finally:
        await conn.close()

@app.post("/fasilitas", tags=["Fasilitas"])
async def create_fasilitas(fasilitas: FasilitasInput):
    conn = await get_db_connection()
    try:
        query = """
            INSERT INTO fasilitas_publik (nama, jenis, geom) 
            VALUES ($1, $2, ST_SetSRID(ST_Point($3, $4), 4326)) 
            RETURNING id, nama
        """
        row = await conn.fetchrow(query, fasilitas.nama, fasilitas.jenis, fasilitas.longitude, fasilitas.latitude)
        return {"pesan": "Data berhasil ditambahkan", "data": dict(row)}
    finally:
        await conn.close()

@app.get("/fasilitas/geojson/all", tags=["GeoJSON"])
async def get_fasilitas_geojson():
    conn = await get_db_connection()
    try:
        query = """
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(f.*)::json)
            ) as geojson
            FROM fasilitas_publik f;
        """
        row = await conn.fetchrow(query)
        return json.loads(row['geojson'])
    finally:
        await conn.close()

@app.get("/fasilitas/spasial/nearby", tags=["Analisis Spasial"])
async def get_nearby_fasilitas(
    lon: float = Query(..., description="Longitude titik pusat"),
    lat: float = Query(..., description="Latitude titik pusat"),
    radius: float = Query(500, description="Radius pencarian dalam meter")
):
    conn = await get_db_connection()
    try:
        query = """
            SELECT nama, jenis,
            ROUND(ST_Distance(geom::geography, ST_SetSRID(ST_Point($1, $2), 4326)::geography)::numeric, 2) as jarak_m
            FROM fasilitas_publik
            WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_Point($1, $2), 4326)::geography, $3)
            ORDER BY jarak_m ASC;
        """
        rows = await conn.fetch(query, lon, lat, radius)
        return {"titik_pusat": {"lon": lon, "lat": lat}, "radius_meter": radius, "hasil": [dict(row) for row in rows]}
    finally:
        await conn.close()