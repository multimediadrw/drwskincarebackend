# Migration System untuk Foto Utama ke Google Cloud Storage

Sistem ini memungkinkan migrasi gambar dari kolom `foto_utama` (URL external) ke Google Cloud Storage dan menyimpannya di tabel `foto_produk`.

## 📁 Files yang Dibuat

1. **`src/lib/migration.ts`** - Utility functions untuk download dan upload gambar
2. **`src/app/api/migrate-foto-utama/route.ts`** - API endpoint untuk migrasi
3. **`src/app/api/test-migration/route.ts`** - API untuk testing dan validasi

## 🚀 Cara Penggunaan

### 1. Cek Status Migrasi
```bash
GET /api/migrate-foto-utama
```

Response:
```json
{
  "needMigration": {
    "produk": 5,
    "paket": 3,
    "total": 8
  },
  "alreadyMigrated": {
    "produk": 2,
    "paket": 1,
    "total": 3
  }
}
```

### 2. Test Data Sample
```bash
GET /api/test-migration
```

Response: Sample data produk dan paket untuk preview

### 3. Validasi URL Individual
```bash
POST /api/test-migration
Content-Type: application/json

{
  "url": "https://example.com/image.jpg"
}
```

### 4. Dry Run Migration (Testing)
```bash
POST /api/migrate-foto-utama
Content-Type: application/json

{
  "itemType": "produk",  // "produk" | "paket" | "all"
  "limit": 5,
  "validateUrls": true,
  "dryRun": true
}
```

### 5. Actual Migration
```bash
POST /api/migrate-foto-utama
Content-Type: application/json

{
  "itemType": "all",
  "limit": 10,
  "validateUrls": true,
  "dryRun": false
}
```

## 🔒 Safety Features

1. **Duplikasi Prevention**: Hanya migrate item yang belum memiliki foto_produk dengan urutan = 0
2. **URL Validation**: Cek apakah URL accessible dan benar-benar gambar
3. **Dry Run Mode**: Test tanpa melakukan perubahan actual
4. **Error Handling**: Comprehensive error logging dan handling
5. **Batch Processing**: Process dalam batch untuk avoid timeout
6. **Image Optimization**: Otomatis resize ke max 1200px dan optimize quality

## 📊 Response Format

```json
{
  "success": true,
  "message": "Migration completed",
  "stats": {
    "totalProcessed": 10,
    "successful": 8,
    "failed": 1,
    "skipped": 1,
    "results": [
      {
        "id": "123",
        "itemType": "produk",
        "nama": "Serum Vitamin C",
        "originalUrl": "https://external.com/image.jpg",
        "status": "success",
        "newUrl": "https://storage.googleapis.com/bucket/produk/123/migrated-0-uuid.jpg"
      }
    ]
  }
}
```

## 🧪 Testing Steps

1. **Test Connection**:
   ```bash
   GET /api/test-migration
   ```

2. **Validate Sample URLs**:
   ```bash
   POST /api/test-migration
   {"url": "URL_FROM_SAMPLE"}
   ```

3. **Dry Run 1 Item**:
   ```bash
   POST /api/migrate-foto-utama
   {"itemType": "produk", "limit": 1, "dryRun": true}
   ```

4. **Migrate 1 Item**:
   ```bash
   POST /api/migrate-foto-utama
   {"itemType": "produk", "limit": 1, "dryRun": false}
   ```

5. **Full Migration**:
   ```bash
   POST /api/migrate-foto-utama
   {"itemType": "all", "limit": 50, "dryRun": false}
   ```

## ⚠️ Important Notes

- Kolom `foto_utama` **TIDAK DIHAPUS** (sesuai request)
- Gambar di-duplicate ke GCS dengan folder structure: `produk/{id}/` atau `paket/{id}/`
- Main photo memiliki `urutan = 0` di tabel `foto_produk`
- Images otomatis di-optimize (max 1200px, quality 85%)
- Support format: JPEG, PNG, WebP (output: JPEG)

## 🔄 Process Flow

1. Query database untuk item dengan foto_utama tapi belum ada foto_produk urutan=0
2. Validate URL accessibility (optional)
3. Download gambar dari URL external
4. Process dengan Sharp (resize + optimize)
5. Upload ke Google Cloud Storage
6. Insert record ke tabel foto_produk
7. Return migration statistics

## 📝 Database Changes

Tidak ada perubahan schema database. Hanya menambah records di tabel `foto_produk`:

```sql
-- Contoh record yang akan ditambahkan
INSERT INTO foto_produk (produk_id, url_foto, alt_text, urutan)
VALUES (123, 'https://storage.googleapis.com/...', 'Product Name - Main Photo', 0);
```