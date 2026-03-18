#!/usr/bin/env node

/**
 * ESP32-CAM Connection Test Script
 * 
 * This script tests connectivity to your ESP32-CAM device
 * and verifies that the required endpoints are accessible.
 */

import http from 'http';
import https from 'https';

// Configuration (update these to match your setup)
const ESP32_BASE_URL = process.env.VITE_ESP32_BASE_URL || 'http://192.168.1.22';
const STREAM_ENDPOINT = process.env.VITE_ESP32_STREAM_ENDPOINT || '/stream';
const CAPTURE_ENDPOINT = process.env.VITE_ESP32_CAPTURE_ENDPOINT || '/capture';
const CONTROL_ENDPOINT = process.env.VITE_ESP32_CONTROL_ENDPOINT || '/control';

console.log('🔍 ESP32-CAM Connection Test');
console.log('============================');
console.log(`Base URL: ${ESP32_BASE_URL}`);
console.log('');

// Test a single endpoint
function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, { timeout: 5000 }, (res) => {
      const responseTime = Date.now() - startTime;
      const status = res.statusCode;
      
      if (status === 200) {
        console.log(`✅ ${description}: OK (${status}) - ${responseTime}ms`);
        resolve({ success: true, status, responseTime });
      } else {
        console.log(`⚠️  ${description}: Unexpected status (${status}) - ${responseTime}ms`);
        resolve({ success: false, status, responseTime });
      }
      
      // Consume response to free up memory
      res.resume();
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      console.log(`❌ ${description}: Failed - ${error.message} (${responseTime}ms)`);
      resolve({ success: false, error: error.message, responseTime });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      console.log(`⏱️  ${description}: Timeout (${responseTime}ms)`);
      resolve({ success: false, error: 'Timeout', responseTime });
    });
  });
}

// Main test function
async function runTests() {
  const tests = [
    {
      url: `${ESP32_BASE_URL}${STREAM_ENDPOINT}`,
      description: 'Stream Endpoint'
    },
    {
      url: `${ESP32_BASE_URL}${CAPTURE_ENDPOINT}`,
      description: 'Capture Endpoint'
    },
    {
      url: `${ESP32_BASE_URL}${CONTROL_ENDPOINT}`,
      description: 'Control Endpoint'
    }
  ];
  
  console.log('Testing endpoints...\n');
  
  const results = [];
  for (const test of tests) {
    const result = await testEndpoint(test.url, test.description);
    results.push({ ...test, ...result });
  }
  
  console.log('\n📊 Test Summary');
  console.log('================');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`Successful: ${successful}/${total}`);
  
  if (successful === total) {
    console.log('🎉 All tests passed! Your ESP32-CAM is ready for integration.');
  } else {
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('- Verify ESP32-CAM is powered on and connected to WiFi');
    console.log('- Check that the IP address matches your device');
    console.log('- Ensure CameraWebServer firmware is loaded');
    console.log('- Verify network connectivity from this machine');
    console.log('- Check firewall settings');
  }
  
  console.log('\n📝 Configuration for .env file:');
  console.log(`VITE_ESP32_BASE_URL=${ESP32_BASE_URL}`);
  console.log(`VITE_ESP32_STREAM_ENDPOINT=${STREAM_ENDPOINT}`);
  console.log(`VITE_ESP32_CAPTURE_ENDPOINT=${CAPTURE_ENDPOINT}`);
  console.log(`VITE_ESP32_CONTROL_ENDPOINT=${CONTROL_ENDPOINT}`);
}

// Run the tests
runTests().catch(console.error);
