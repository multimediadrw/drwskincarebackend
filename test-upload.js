// Simple test script to upload a small test image
const fs = require('fs');
const FormData = require('form-data');

// Create a minimal 1x1 pixel PNG image (base64 encoded)
const minimalPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

async function testUpload() {
  try {
    const form = new FormData();
    form.append('file', minimalPNG, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    form.append('productId', '18221208571');
    form.append('itemType', 'produk');
    form.append('urutan', '0');
    form.append('altText', 'Test upload from script');

    const response = await fetch('http://localhost:3000/api/upload-photo', {
      method: 'POST',
      body: form
    });

    const result = await response.json();
    console.log('Upload result:', result);

    if (response.ok) {
      console.log('✅ Upload successful!');
    } else {
      console.log('❌ Upload failed:', result);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUpload();