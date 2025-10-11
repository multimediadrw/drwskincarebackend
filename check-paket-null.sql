-- Check paket photos with NULL issues
SELECT 
    id_foto,
    produk_id,
    paket_id, 
    url_foto,
    alt_text,
    'paket_issue' as issue_type
FROM foto_produk 
WHERE urutan = 0 
  AND url_foto LIKE '%/pakets/%' 
  AND paket_id IS NULL
LIMIT 10;

-- Check all paket photos to see pattern
SELECT 
    id_foto,
    produk_id,
    paket_id,
    CASE 
        WHEN url_foto LIKE '%/pakets/%' THEN 'paket_url'
        WHEN url_foto LIKE '%/produks/%' THEN 'produk_url'
        ELSE 'unknown'
    END as url_type,
    alt_text
FROM foto_produk 
WHERE urutan = 0
  AND url_foto LIKE '%/pakets/%'
ORDER BY id_foto
LIMIT 10;