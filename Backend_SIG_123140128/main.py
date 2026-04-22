from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import bcrypt 
from jose import jwt, JWTError
from datetime import datetime, timedelta
import asyncpg
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="API Fasilitas Publik - Ragil Bayu Saputra",
    description="REST API Integrasi PostGIS dengan JWT Auth",
    version="2.0.0"
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

SECRET_KEY = "rahasia_negara_ragil_123" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token tidak valid")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid atau kadaluarsa")

class UserRegister(BaseModel):
    email: str
    password: str

async def get_db_connection():
    return await asyncpg.connect(**DB_CONFIG)

@app.post("/register", tags=["Auth"])
async def register_user(user: UserRegister):
    conn = await get_db_connection()
    try:
        existing_user = await conn.fetchrow("SELECT id FROM users WHERE email = $1", user.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email sudah terdaftar")
        
        hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        await conn.execute(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2)",
            user.email, hashed_password
        )
        return {"pesan": "Registrasi berhasil, silakan login"}
    finally:
        await conn.close()

@app.post("/login", tags=["Auth"])
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = await get_db_connection()
    try:
        user = await conn.fetchrow("SELECT * FROM users WHERE email = $1", form_data.username)
        
        if not user:
            raise HTTPException(status_code=401, detail="Email atau Password salah")

        is_password_correct = bcrypt.checkpw(
            form_data.password.encode('utf-8'), 
            user["password_hash"].encode('utf-8')
        )
        
        if not is_password_correct:
            raise HTTPException(status_code=401, detail="Email atau Password salah")
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_token(
            data={"sub": user["email"]}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    finally:
        await conn.close()

class FasilitasInput(BaseModel):
    nama: str
    jenis: str
    longitude: float
    latitude: float

@app.get("/fasilitas", tags=["Fasilitas"])
async def get_all_fasilitas():
    conn = await get_db_connection()
    try:
        query = "SELECT id, nama, jenis FROM fasilitas_publik"
        rows = await conn.fetch(query)
        return {"data": [dict(row) for row in rows]}
    finally:
        await conn.close()

@app.post("/fasilitas", tags=["Fasilitas"])
async def create_fasilitas(fasilitas: FasilitasInput, current_user: str = Depends(get_current_user)):
    conn = await get_db_connection()
    try:
        query = """
            INSERT INTO fasilitas_publik (nama, jenis, geom) 
            VALUES ($1, $2, ST_SetSRID(ST_Point($3, $4), 4326)) 
            RETURNING id, nama
        """
        row = await conn.fetchrow(query, fasilitas.nama, fasilitas.jenis, fasilitas.longitude, fasilitas.latitude)
        return {
            "pesan": f"Data berhasil ditambahkan oleh {current_user}", 
            "data": dict(row)
        }
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
        
@app.put("/fasilitas/{fasilitas_id}", tags=["Fasilitas"])
async def update_fasilitas(fasilitas_id: int, fasilitas: FasilitasInput, current_user: str = Depends(get_current_user)):
    conn = await get_db_connection()
    try:
        query = """
            UPDATE fasilitas_publik 
            SET nama = $1, jenis = $2, geom = ST_SetSRID(ST_Point($3, $4), 4326)
            WHERE id = $5
            RETURNING id, nama
        """
        row = await conn.fetchrow(query, fasilitas.nama, fasilitas.jenis, fasilitas.longitude, fasilitas.latitude, fasilitas_id)
        
        if not row:
            raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
            
        return {"pesan": f"Data berhasil diubah oleh {current_user}", "data": dict(row)}
    finally:
        await conn.close()

@app.delete("/fasilitas/{fasilitas_id}", tags=["Fasilitas"])
async def delete_fasilitas(fasilitas_id: int, current_user: str = Depends(get_current_user)):
    conn = await get_db_connection()
    try:
        query = "DELETE FROM fasilitas_publik WHERE id = $1 RETURNING id, nama"
        row = await conn.fetchrow(query, fasilitas_id)
        
        if not row:
            raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
            
        return {"pesan": f"Data '{row['nama']}' berhasil dihapus oleh {current_user}"}
    finally:
        await conn.close()