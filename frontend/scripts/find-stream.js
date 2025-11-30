#!/usr/bin/env node

import http from 'http';

const ESP32_BASE_URL = 'http://192.168.1.18';

// Common streaming endpoints for different ESP32-CAM firmwares
const streamEndpoints = [
  '/stream',
  '/mjpeg/1',
  '/mjpeg',
  '/video',
  '/cam-hi.jpg',
  '/cam-lo.jpg',
  '/cam-mid.jpg',
  '/cam.jpg',
  '/snapshot.jpg',
  '/image.jpg'
];

function testStreamEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${ESP32_BASE_URL}${endpoint}`;
    console.log(`Testing: ${url}`);
    
    const req = http.get(url, { timeout: 5000 }, (res) => {
      const contentType = res.headers['content-type'] || '';
      const contentLength = res.headers['content-length'] || 'unknown';
      
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Content-Type: ${contentType}`);
      console.log(`  Content-Length: ${contentLength}`);
      
      if (contentType.includes('multipart')) {
        console.log(`  🎥 MJPEG STREAM FOUND! ${url}`);
        resolve({ endpoint, url, type: 'mjpeg', working: true });
      } else if (contentType.includes('image/jpeg')) {
        console.log(`  📸 JPEG IMAGE FOUND! ${url}`);
        resolve({ endpoint, url, type: 'jpeg', working: true });
      } else {
        console.log(`  ❌ Not a video stream`);
        resolve({ endpoint, url, type: 'unknown', working: false });
      }
      
      res.resume(); // consume response
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ Error: ${error.message}`);
      resolve({ endpoint, url, error: error.message, working: false });
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`  ⏱️  Timeout`);
      resolve({ endpoint, url, error: 'Timeout', working: false });
    });
  });
}

async function findStreamingEndpoint() {
  console.log('🔍 Finding ESP32-CAM streaming endpoint...\n');
  
  for (const endpoint of streamEndpoints) {
    const result = await testStreamEndpoint(endpoint);
    
    if (result.working && result.type === 'mjpeg') {
      console.log(`\n✅ REAL-TIME STREAMING ENDPOINT FOUND!`);
      console.log(`URL: ${result.url}`);
      console.log(`Type: MJPEG Stream (real-time)`);
      return result;
    }
    
    console.log(''); // spacing
    await new Promise(resolve => setTimeout(resolve, 500)); // delay between tests
  }
  
  console.log('\n⚠️  No MJPEG stream found. Your ESP32-CAM might need different firmware.');
  console.log('💡 Consider flashing with CameraWebServer example that includes streaming.');
}

findStreamingEndpoint();