// Alternative build script that doesn't use native plugins
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const path = require('path');
const fs = require('fs');

// Force Rollup to use the JS implementation
process.env.ROLLUP_NATIVE_DISABLE = 'true';

async function runBuild() {
  try {
    console.log('Starting alternative build process...');
    
    // Import vite programmatically
    const { build } = await import('vite');
    
    // Run build with simplified config
    await build({
      configFile: 'vite.config.simple.js'
    });
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild(); 