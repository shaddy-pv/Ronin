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

async function checkInterface() {
  try {
    console.log('🔍 Checking ESP32-CAM web interface...\n');
    
    const content = await getPageContent(ESP32_BASE_URL);
    
    // Look for streaming-related elements
    const streamingKeywords = [
      'stream', 'mjpeg', 'video', 'camera', 'live',
      'startStream', 'stopStream', 'view', 'feed'
    ];
    
    console.log('📄 Web interface analysis:');
    console.log('==========================');
    
    streamingKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      if (matches) {
        console.log(`✅ Found "${keyword}": ${matches.length} occurrence(s)`);
      }
    });
    
    // Look for specific patterns
    const urlPattern = /(?:href|src|action)=["']([^"']*(?:stream|mjpeg|video|cam)[^"']*)["']/gi;
    const urls = [];
    let match;
    
    while ((match = urlPattern.exec(content)) !== null) {
      urls.push(match[1]);
    }
    
    if (urls.length > 0) {
      console.log('\n📹 Potential streaming URLs found:');
      urls.forEach(url => {
        console.log(`   ${url}`);
      });
    }
    
    // Check for JavaScript functions
    const jsPattern = /function\s+(\w*(?:stream|video|cam|start|stop)\w*)/gi;
    const functions = [];
    
    while ((match = jsPattern.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    if (functions.length > 0) {
      console.log('\n🔧 Camera-related JavaScript functions:');
      functions.forEach(func => {
        console.log(`   ${func}()`);
      });
    }
    
    // Look for button or control elements
    const controlPattern = /<(?:button|input)[^>]*(?:stream|video|cam|start|stop)[^>]*>/gi;
    const controls = content.match(controlPattern);
    
    if (controls) {
      console.log('\n🎛️  Camera controls found:');
      controls.forEach(control => {
        console.log(`   ${control}`);
      });
    }
    
    console.log('\n💡 Next steps:');
    console.log('- Visit http://192.168.1.18/ in your browser to see the interface');
    console.log('- Look for "Start Stream" or similar buttons');
    console.log('- Check browser developer tools for streaming URLs');
    
  } catch (error) {
    console.error('❌ Error checking interface:', error.message);
  }
}

checkInterface();