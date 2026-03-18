#!/usr/bin/env node

/**
 * ESP32-CAM Endpoint Discovery Script
 * 
 * This script discovers available endpoints on your ESP32-CAM
 */

import http from 'http';

const ESP32_BASE_URL = 'http://192.168.1.22';

// Common ESP32-CAM endpoints to test
const endpoints = [
  '/',
  '/stream',
  '/mjpeg',
  '/video',
  '/cam',
  '/capture',
  '/jpg',
  '/photo',
  '/control',
  '/status',
  '/config'
];

console.log('🔍 ESP32-CAM Endpoint Discovery');
console.log('===============================');
console.log(`Base URL: ${ESP32_BASE_URL}`);
console.log('');

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${ESP32_BASE_URL}${endpoint}`;
    const startTime = Date.now();
    
    const req = http.get(url, { timeout: 3000 }, (res) => {
      const responseTime = Date.now() - startTime;
      const status = res.statusCode;
      const contentType = res.headers['content-type'] || 'unknown';
      
      console.log(`${status === 200 ? '✅' : status === 404 ? '❌' : '⚠️ '} ${endpoint.padEnd(12)} - ${status} (${contentType}) - ${responseTime}ms`);
      
      resolve({ endpoint, status, contentType, responseTime, success: status === 200 });
      
      // Consume response to free up memory
      res.resume();
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      console.log(`❌ ${endpoint.padEnd(12)} - Error: ${error.message} (${responseTime}ms)`);
      resolve({ endpoint, error: error.message, responseTime, success: false });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      console.log(`⏱️  ${endpoint.padEnd(12)} - Timeout (${responseTime}ms)`);
      resolve({ endpoint, error: 'Timeout', responseTime, success: false });
    });
  });
}

async function discoverEndpoints() {
  console.log('Testing common endpoints...\n');
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Discovery Summary');
  console.log('====================');
  
  const working = results.filter(r => r.success);
  const streaming = results.filter(r => r.success && r.contentType && r.contentType.includes('multipart'));
  
  console.log(`Working endpoints: ${working.length}/${results.length}`);
  
  if (working.length > 0) {
    console.log('\n✅ Available endpoints:');
    working.forEach(r => {
      console.log(`   ${r.endpoint} - ${r.contentType}`);
    });
  }
  
  if (streaming.length > 0) {
    console.log('\n📹 Streaming endpoints (likely MJPEG):');
    streaming.forEach(r => {
      console.log(`   ${ESP32_BASE_URL}${r.endpoint}`);
    });
  }
  
  console.log('\n💡 Recommended configuration:');
  const streamEndpoint = streaming.length > 0 ? streaming[0].endpoint : 
                        working.find(r => r.endpoint.includes('stream'))?.endpoint || '/stream';
  const captureEndpoint = working.find(r => r.endpoint === '/capture')?.endpoint || 
                         working.find(r => r.endpoint.includes('jpg') || r.endpoint.includes('photo'))?.endpoint || '/capture';
  
  console.log(`VITE_ESP32_BASE_URL=${ESP32_BASE_URL}`);
  console.log(`VITE_ESP32_STREAM_ENDPOINT=${streamEndpoint}`);
  console.log(`VITE_ESP32_CAPTURE_ENDPOINT=${captureEndpoint}`);
}

discoverEndpoints().catch(console.error);
