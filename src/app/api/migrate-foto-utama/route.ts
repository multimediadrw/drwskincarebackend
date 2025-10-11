import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { migrateImageToGCS, validateImageUrl, MigrationResult } from '@/lib/migration';

export interface MigrationStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  skipped: number;
  results: Array<{
    id: string;
    itemType: 'produk' | 'paket';
    nama: string;
    originalUrl: string;
    status: 'success' | 'failed' | 'skipped';
    newUrl?: string;
    error?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      itemType, 
      limit = 10, 
      validateUrls = true,
      dryRun = false 
    } = body;

    console.log('Starting migration process:', { itemType, limit, validateUrls, dryRun });

    const stats: MigrationStats = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      results: []
    };

    // Get data from database based on itemType
    if (itemType === 'produk' || itemType === 'all') {
      await migrateProdukData(stats, limit, validateUrls, dryRun);
    }

    if (itemType === 'paket' || itemType === 'all') {
      await migratePaketData(stats, limit, validateUrls, dryRun);
    }

    return NextResponse.json({
      success: true,
      message: dryRun ? 'Dry run completed' : 'Migration completed',
      stats
    });

  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function migrateProdukData(
  stats: MigrationStats, 
  limit: number, 
  validateUrls: boolean, 
  dryRun: boolean
) {
  // Get products with foto_utama but no existing foto_produk with urutan = 0
  const products = await prisma.produk.findMany({
    where: {
      AND: [
        { foto_utama: { not: null } },
        { foto_utama: { not: '' } },
        {
          foto_produk: {
            none: {
              AND: [
                { urutan: 0 },
                { produk_id: { not: null } }
              ]
            }
          }
        }
      ]
    },
    take: limit,
    orderBy: { created_at: 'desc' }
  });

  console.log(`Found ${products.length} products to migrate`);

  for (const product of products) {
    stats.totalProcessed++;
    
    const resultItem: {
      id: string;
      itemType: 'produk';
      nama: string;
      originalUrl: string;
      status: 'success' | 'failed' | 'skipped';
      newUrl?: string;
      error?: string;
    } = {
      id: product.id_produk.toString(),
      itemType: 'produk',
      nama: product.nama_produk,
      originalUrl: product.foto_utama!,
      status: 'skipped',
    };

    try {
      // Validate URL if requested
      if (validateUrls) {
        const isValid = await validateImageUrl(product.foto_utama!);
        if (!isValid) {
          resultItem.status = 'failed';
          resultItem.error = 'Invalid or inaccessible URL';
          stats.failed++;
          stats.results.push(resultItem);
          continue;
        }
      }

      if (!dryRun) {
        // Perform actual migration
        const migrationResult = await migrateImageToGCS(
          product.foto_utama!,
          product.id_produk.toString(),
          'produk',
          0 // urutan 0 for main photo
        );

        if (migrationResult.success) {
          // Save to foto_produk table
          await prisma.foto_produk.create({
            data: {
              produk_id: product.id_produk,
              url_foto: migrationResult.newUrl!,
              alt_text: `${product.nama_produk} - Main Photo`,
              urutan: 0
            }
          });

          resultItem.status = 'success';
          resultItem.newUrl = migrationResult.newUrl;
          stats.successful++;
        } else {
          resultItem.status = 'failed';
          resultItem.error = migrationResult.error;
          stats.failed++;
        }
      } else {
        // Dry run - just mark as successful
        resultItem.status = 'success';
        resultItem.newUrl = 'DRY_RUN_URL';
        stats.successful++;
      }

    } catch (error) {
      resultItem.status = 'failed';
      resultItem.error = error instanceof Error ? error.message : 'Unknown error';
      stats.failed++;
    }

    stats.results.push(resultItem);
  }
}

async function migratePaketData(
  stats: MigrationStats, 
  limit: number, 
  validateUrls: boolean, 
  dryRun: boolean
) {
  // Get paket_produk with foto_utama but no existing foto_produk with urutan = 0
  const pakets = await prisma.paket_produk.findMany({
    where: {
      AND: [
        { foto_utama: { not: null } },
        { foto_utama: { not: '' } },
        {
          foto_produk: {
            none: {
              AND: [
                { urutan: 0 },
                { paket_id: { not: null } }
              ]
            }
          }
        }
      ]
    },
    take: limit,
    orderBy: { created_at: 'desc' }
  });

  console.log(`Found ${pakets.length} pakets to migrate`);

  for (const paket of pakets) {
    stats.totalProcessed++;
    
    const resultItem: {
      id: string;
      itemType: 'paket';
      nama: string;
      originalUrl: string;
      status: 'success' | 'failed' | 'skipped';
      newUrl?: string;
      error?: string;
    } = {
      id: paket.id_paket.toString(),
      itemType: 'paket',
      nama: paket.nama_paket,
      originalUrl: paket.foto_utama!,
      status: 'skipped',
    };

    try {
      // Validate URL if requested
      if (validateUrls) {
        const isValid = await validateImageUrl(paket.foto_utama!);
        if (!isValid) {
          resultItem.status = 'failed';
          resultItem.error = 'Invalid or inaccessible URL';
          stats.failed++;
          stats.results.push(resultItem);
          continue;
        }
      }

      if (!dryRun) {
        // Perform actual migration
        const migrationResult = await migrateImageToGCS(
          paket.foto_utama!,
          paket.id_paket.toString(),
          'paket',
          0 // urutan 0 for main photo
        );

        if (migrationResult.success) {
          // Save to foto_produk table
          await prisma.foto_produk.create({
            data: {
              paket_id: paket.id_paket,
              url_foto: migrationResult.newUrl!,
              alt_text: `${paket.nama_paket} - Main Photo`,
              urutan: 0
            }
          });

          resultItem.status = 'success';
          resultItem.newUrl = migrationResult.newUrl;
          stats.successful++;
        } else {
          resultItem.status = 'failed';
          resultItem.error = migrationResult.error;
          stats.failed++;
        }
      } else {
        // Dry run - just mark as successful
        resultItem.status = 'success';
        resultItem.newUrl = 'DRY_RUN_URL';
        stats.successful++;
      }

    } catch (error) {
      resultItem.status = 'failed';
      resultItem.error = error instanceof Error ? error.message : 'Unknown error';
      stats.failed++;
    }

    stats.results.push(resultItem);
  }
}

// GET endpoint to check migration status
export async function GET() {
  try {
    // Count items that need migration
    const produkCount = await prisma.produk.count({
      where: {
        AND: [
          { foto_utama: { not: null } },
          { foto_utama: { not: '' } },
          {
            foto_produk: {
              none: {
                AND: [
                  { urutan: 0 },
                  { produk_id: { not: null } }
                ]
              }
            }
          }
        ]
      }
    });

    const paketCount = await prisma.paket_produk.count({
      where: {
        AND: [
          { foto_utama: { not: null } },
          { foto_utama: { not: '' } },
          {
            foto_produk: {
              none: {
                AND: [
                  { urutan: 0 },
                  { paket_id: { not: null } }
                ]
              }
            }
          }
        ]
      }
    });

    // Count already migrated
    const migratedProduk = await prisma.foto_produk.count({
      where: {
        AND: [
          { produk_id: { not: null } },
          { urutan: 0 }
        ]
      }
    });

    const migratedPaket = await prisma.foto_produk.count({
      where: {
        AND: [
          { paket_id: { not: null } },
          { urutan: 0 }
        ]
      }
    });

    return NextResponse.json({
      needMigration: {
        produk: produkCount,
        paket: paketCount,
        total: produkCount + paketCount
      },
      alreadyMigrated: {
        produk: migratedProduk,
        paket: migratedPaket,
        total: migratedProduk + migratedPaket
      }
    });

  } catch (error) {
    console.error('Migration status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}