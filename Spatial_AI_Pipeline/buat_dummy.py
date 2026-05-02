import rasterio
from rasterio.transform import from_origin
import cv2

def buat_geotiff_dummy():
    print("Membaca citra.png...")
    img = cv2.imread('citra.png')
    
    if img is None:
        print("Error: File citra.png tidak ditemukan! Pastikan nama dan lokasinya benar.")
        return

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    transform = from_origin(105.3050, -5.3540, 0.000015, 0.000015)

    print("Menyuntikkan koordinat dan membuat file citra_udara.tif...")
    with rasterio.open(
        'citra_udara.tif', 'w', driver='GTiff',
        height=img.shape[0], width=img.shape[1],
        count=3, dtype=img.dtype,
        crs='+proj=latlong', transform=transform
    ) as dataset:
        dataset.write(img[:,:,0], 1) 
        dataset.write(img[:,:,1], 2)
        dataset.write(img[:,:,2], 3) 

    print("Selesai! File citra_udara.tif sudah jadi dan siap dideteksi.")

if __name__ == "__main__":
    buat_geotiff_dummy()