-- Check foto_produk migration results
SELECT 
    'produk' as type,
    COUNT(*) as total_foto,
    COUNT(CASE WHEN produk_id IS NOT NULL THEN 1 END) as with_produk_id,
    COUNT(CASE WHEN paket_id IS NOT NULL THEN 1 END) as with_paket_id
FROM foto_produk 
WHERE urutan = 0

UNION ALL

SELECT 
    'all_foto_produk' as type,
    COUNT(*) as total_foto,
    COUNT(CASE WHEN produk_id IS NOT NULL THEN 1 END) as with_produk_id,
    COUNT(CASE WHEN paket_id IS NOT NULL THEN 1 END) as with_paket_id
FROM foto_produk;

-- Sample migrated produk photos
SELECT 'Sample Produk Photos:' as info, 
       fp.id_foto, fp.produk_id, fp.paket_id, fp.url_foto, p.nama_produk
FROM foto_produk fp
LEFT JOIN produk p ON fp.produk_id = p.id_produk
WHERE fp.urutan = 0 AND fp.produk_id IS NOT NULL
LIMIT 5;

-- Sample migrated paket photos  
SELECT 'Sample Paket Photos:' as info,
       fp.id_foto, fp.produk_id, fp.paket_id, fp.url_foto, pp.nama_paket
FROM foto_produk fp
LEFT JOIN paket_produk pp ON fp.paket_id = pp.id_paket  
WHERE fp.urutan = 0 AND fp.paket_id IS NOT NULL
LIMIT 5;