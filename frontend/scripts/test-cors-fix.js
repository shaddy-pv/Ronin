#!/usr/bin/env node
/**
 * Test CORS fix for ESP32-CAM
 */

const testUrls = [
  'http://localhost:8080/api/camera/capture',  // Through proxy
  'http://192.168.1.22/capture'               // Direct (should fail with CORS)
];

async function testCorsfix() {
  console.log('🧪 Testing CORS fix...\n');
  
  for (const url of testUrls) {
    console.log(`Testing: ${url}`);
    
    try {
      const response = await fetch(url + '?test=' + Date.now());
      console.log(`✅ Success: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    
    console.log('');
  }
}

// Run in browser console or Node.js
if (typeof window !== 'undefined') {
  // Browser environment
  testCorsfix();
} else {
  // Node.js environment - use node-fetch
  import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    testCorsfix();
  }).catch(() => {
    console.log('Install node-fetch to run this test in Node.js');
    console.log('npm install node-fetch');
  });
}
