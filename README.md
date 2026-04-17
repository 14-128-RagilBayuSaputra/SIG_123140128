# WebGIS Fasilitas Publik - Kawasan Way Huwi

Proyek Sistem Informasi Geografis (SIG) Full-Stack yang memetakan persebaran fasilitas publik di sekitar kawasan Way Huwi dan ITERA. Dibangun untuk memenuhi tugas praktikum Mata Kuliah Sistem Informasi Geografis.

## 👤 Identitas Pengembang
* **Nama:** Ragil Bayu Saputra 
* **NIM:** 123140128
* **Program Studi:** Teknik Informatika

## 🚀 Fitur Utama
- **Peta Interaktif:** Menggunakan Leaflet dengan basemap CartoDB Voyager.
- **Visualisasi Geospasial:** Menampilkan data GeoJSON langsung dari database PostGIS.
- **Klasifikasi Data:** Pewarnaan marker otomatis berdasarkan kategori fasilitas (RS, Sekolah, Ibadah, Olahraga).
- **Interaksi Dinamis:** Fitur hover highlight dan popup informasi detail.
- **REST API:** Backend asinkron menggunakan FastAPI.

## 🛠️ Teknologi yang Digunakan
- **Frontend:** React.js, Vite, React-Leaflet, Axios.
- **Backend:** Python, FastAPI, Uvicorn, Asyncpg.
- **Database:** PostgreSQL + PostGIS.

## 💻 Cara Menjalankan Proyek
1. **Persiapan Database:**
   - Pastikan PostgreSQL dan ekstensi PostGIS sudah terinstal.
   - Restore atau buat database bernama `sig_123140128`.
2. **Menjalankan Backend:**
   - Masuk ke folder `Backend_SIG_123140128`.
   - Jalankan `uvicorn main:app --reload`.
3. **Menjalankan Frontend:**
   - Masuk ke folder `Frontend_SIG_123140128`.
   - Jalankan `npm install` lalu `npm run dev`.