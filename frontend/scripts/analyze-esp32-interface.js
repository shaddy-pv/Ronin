#!/usr/bin/env node

import http from 'http';

const ESP32_BASE_URL = 'http://192.168.1.18';

function getPageContent(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function analyzeInterface() {
  try {
    console.log('🔍 Analyzing ESP32-CAM web interface...\n');
    
    const content = await getPageContent(ESP32_BASE_URL);
    
    // Look for streaming URLs in JavaScript
    const jsStreamPattern = /(?:src|url)\s*[=:]\s*["']([^"']*(?:stream|mjpeg|video|jpg)[^"']*)["']/gi;
    const streamUrls = [];
    let match;
    
    while ((match = jsStreamPattern.exec(content)) !== null) {
      streamUrls.push(match[1]);
    }
    
    // Look for image elements with streaming
    const imgPattern = /<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    const imgSources = [];
    
    while ((match = imgPattern.exec(content)) !== null) {
      imgSources.push(match[1]);
    }
    
    // Look for JavaScript functions that handle streaming
    const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*{[^}]*(?:stream|video|img|src)[^}]*}/gi;
    const streamFunctions = [];
    
    while ((match = functionPattern.exec(content)) !== null) {
      streamFunctions.push(match[0]);
    }
    
    console.log('📹 Found streaming URLs:');
    streamUrls.forEach(url => {
      console.log(`  ${url}`);
    });
    
    console.log('\n🖼️  Found image sources:');
    imgSources.forEach(src => {
      console.log(`  ${src}`);
    });
    
    console.log('\n🔧 Found streaming functions:');
    streamFunctions.forEach(func => {
      console.log(`  ${func.substring(0, 100)}...`);
    });
    
    // Extract the actual streaming mechanism
    console.log('\n📄 Full HTML content (first 2000 chars):');
    console.log(content.substring(0, 2000));
    
    // Look for specific patterns that indicate streaming method
    if (content.includes('startStream') || content.includes('stream')) {
      console.log('\n✅ Found streaming functionality in web interface');
    }
    
    if (content.includes('setInterval') || content.includes('setTimeout')) {
      console.log('✅ Found timer-based updates (likely polling)');
    }
    
  } catch (error) {
    console.error('❌ Error analyzing interface:', error.message);
  }
}

analyzeInterface();