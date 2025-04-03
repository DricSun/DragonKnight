// Build script pour site statique sur Render
import { mkdirSync, existsSync, copyFileSync, rmSync, cpSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

try {
  console.log('Starting enhanced build process...');
  
  // Clean output directory if it exists
  if (existsSync('dist')) {
    console.log('Cleaning output directory...');
    rmSync('dist', { recursive: true, force: true });
  }
  
  // Create clean dist directory
  console.log('Creating output directory...');
  mkdirSync('dist');
  
  // Create timestamp file for cache busting
  const timestamp = new Date().toISOString();
  const buildInfo = `Build timestamp: ${timestamp}\nBuild version: ${Math.floor(Math.random() * 10000)}`;
  writeFileSync('dist/build-info.txt', buildInfo);
  console.log(`Build info: ${buildInfo}`);
  
  // Copy index.html to dist
  console.log('Copying index.html to dist...');
  copyFileSync('index.html', 'dist/index.html');
  
  // Copy main.js to dist
  console.log('Copying main.js to dist...');
  copyFileSync('main.js', 'dist/main.js');
  
  // Copy shader directory
  if (existsSync('shader')) {
    console.log('Copying shader directory...');
    mkdirSync('dist/shader', { recursive: true });
    cpSync('shader', 'dist/shader', { recursive: true });
  }
  
  // Copy assets directory
  if (existsSync('assets')) {
    console.log('Copying assets directory...');
    mkdirSync('dist/assets', { recursive: true });
    cpSync('assets', 'dist/assets', { recursive: true });
  }
  
  // Create a .nojekyll file to prevent GitHub Pages from ignoring files that start with an underscore
  writeFileSync('dist/.nojekyll', '');
  
  // Create a simple web.config for IIS/Azure hosting if needed
  const webConfig = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <mimeMap fileExtension=".glb" mimeType="model/gltf-binary" />
      <mimeMap fileExtension=".hdr" mimeType="application/octet-stream" />
    </staticContent>
    <rewrite>
      <rules>
        <rule name="SPA">
          <match url="^(?!.*(.js|.css|.png|.jpg|.jpeg|.gif|.svg|.glb|.hdr|.fbx|.woff|.woff2|.ttf|.eot)).*$" />
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`;
  writeFileSync('dist/web.config', webConfig);
  
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 