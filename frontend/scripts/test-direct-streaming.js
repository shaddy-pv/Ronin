#!/usr/bin/env node

import http from 'http';

const ESP32_BASE_URL = 'http://192.168.1.22';

// Test different streaming approaches that ESP32-CAM might use
const testEndpoints = [
  '/stream',
  '/mjpeg/1',
  '/video',
  '/cam.mjpeg',
  '/stream.mjpeg',
  '/live',
  '/video.mjpeg'
];

function testStreamingEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${ESP32_BASE_URL}${endpoint}`;
    console.log(`\n🔍 Testing: ${url}`);
    
    const req = http.get(url, { timeout: 10000 }, (res) => {
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Content-Type: ${res.headers['content-type']}`);
      console.log(`  Content-Length: ${res.headers['content-length'] || 'streaming'}`);
      
      if (res.headers['content-type']?.includes('multipart')) {
        console.log(`  🎥 MJPEG STREAM DETECTED!`);
        
        let frameCount = 0;
        let dataReceived = 0;
        
        res.on('data', (chunk) => {
          dataReceived += chunk.length;
          
          // Look for JPEG frame boundaries
          if (chunk.includes(Buffer.from([0xFF, 0xD8]))) { // JPEG start
            frameCount++;
            console.log(`    📸 Frame ${frameCount} received (${dataReceived} bytes total)`);
          }
        });
        
        // Test for 5 seconds
        setTimeout(() => {
          req.destroy();
          console.log(`  ✅ Received ${frameCount} frames in 5 seconds`);
          resolve({ endpoint, working: true, frameCount, type: 'mjpeg' });
        }, 5000);
        
      } else {
        res.resume();
        resolve({ endpoint, working: false, type: 'not-stream' });
      }
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ Error: ${error.message}`);
      resolve({ endpoint, working: false, error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`  ⏱️  Timeout`);
      resolve({ endpoint, working: false, error: 'timeout' });
    });
  });
}

// Also test if the web interface uses JavaScript-based streaming
function testJavaScriptStreaming() {
  console.log('\n🔍 Testing JavaScript-based streaming approach...');
  
  // This simulates what the web interface might do
  const testRapidCapture = async () => {
    console.log('Testing rapid capture method...');
    
    let successCount = 0;
    let errorCount = 0;
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch(`${ESP32_BASE_URL}/capture?t=${Date.now()}`);
        if (response.ok) {
          successCount++;
          console.log(`  📸 Capture ${i + 1}: Success (${response.headers.get('content-length')} bytes)`);
        } else {
          errorCount++;
          console.log(`  ❌ Capture ${i + 1}: Failed (${response.status})`);
        }
      } catch (error) {
        errorCount++;
        console.log(`  ❌ Capture ${i + 1}: Error - ${error.message}`);
      }
      
      // Small delay between captures
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const totalTime = Date.now() - startTime;
    const fps = (successCount / totalTime) * 1000;
    
    console.log(`\n📊 Rapid capture results:`);
    console.log(`  Success: ${successCount}/10`);
    console.log(`  Errors: ${errorCount}/10`);
    console.log(`  Total time: ${totalTime}ms`);
    console.log(`  Effective FPS: ${fps.toFixed(2)}`);
    
    return { successCount, errorCount, fps };
  };
  
  return testRapidCapture();
}

async function findBestStreamingMethod() {
  console.log('🚀 Finding the best streaming method for your ESP32-CAM...\n');
  
  // Test MJPEG endpoints first
  for (const endpoint of testEndpoints) {
    const result = await testStreamingEndpoint(endpoint);
    
    if (result.working && result.type === 'mjpeg') {
      console.log(`\n🎉 FOUND WORKING MJPEG STREAM: ${ESP32_BASE_URL}${endpoint}`);
      return result;
    }
  }
  
  // If no MJPEG found, test JavaScript approach
  console.log('\n⚠️  No MJPEG streams found. Testing JavaScript approach...');
  const jsResult = await testJavaScriptStreaming();
  
  if (jsResult.successCount > 7) {
    console.log('\n✅ JavaScript rapid capture works well!');
    console.log('💡 Recommendation: Use optimized capture-based streaming');
    return { type: 'capture', fps: jsResult.fps };
  }
  
  console.log('\n❌ No suitable streaming method found.');
  return null;
}

findBestStreamingMethod();
