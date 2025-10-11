-- Check data for migration
SELECT 'produk' as table_name, COUNT(*) as total_records, 
       COUNT(CASE WHEN foto_utama IS NOT NULL AND foto_utama != '' THEN 1 END) as with_foto_utama
FROM produk
UNION ALL
SELECT 'paket_produk' as table_name, COUNT(*) as total_records,
       COUNT(CASE WHEN foto_utama IS NOT NULL AND foto_utama != '' THEN 1 END) as with_foto_utama  
FROM paket_produk;

-- Sample data from produk
SELECT 'Sample produk:' as info, id_produk, nama_produk, foto_utama 
FROM produk 
WHERE foto_utama IS NOT NULL AND foto_utama != '' 
LIMIT 3;

-- Sample data from paket_produk
SELECT 'Sample paket:' as info, id_paket, nama_paket, foto_utama
FROM paket_produk
WHERE foto_utama IS NOT NULL AND foto_utama != ''
LIMIT 3;