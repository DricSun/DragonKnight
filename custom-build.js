// Build script - copie index.html, main.js et les assets
import { mkdirSync, existsSync, copyFileSync, rmSync, cpSync } from 'fs';
import { join } from 'path';

try {
  console.log('Starting build process...');
  
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
  
  // Copy main.js to dist
  console.log('Copying main.js to dist...');
  copyFileSync('main.js', 'dist/main.js');
  
  // Copy assets directory
  if (existsSync('assets')) {
    console.log('Copying assets directory...');
    mkdirSync('dist/assets', { recursive: true });
    cpSync('assets', 'dist/assets', { recursive: true });
  }
  
  // Create a timestamp file for cache busting
  console.log('Creating timestamp file...');
  const timestamp = new Date().toISOString();
  const timestampContent = `Build timestamp: ${timestamp}`;
  
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 