// Ultra simple build script - just copy index.html
import { mkdirSync, existsSync, copyFileSync, rmSync } from 'fs';

try {
  console.log('Starting ultra simple build...');
  
  // Clean output directory if it exists
  if (existsSync('dist')) {
    console.log('Cleaning output directory...');
    rmSync('dist', { recursive: true, force: true });
  }
  
  // Create clean dist directory
  console.log('Creating output directory...');
  mkdirSync('dist');
  
  // Copy index.html to dist
  console.log('Copying index.html to dist...');
  copyFileSync('index.html', 'dist/index.html');
  
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 