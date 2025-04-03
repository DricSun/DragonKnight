// Ultra simple build script for Vercel deployment
import { createRequire } from 'module';
import { writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

try {
  console.log('Starting ultra simple build process...');
  
  // Create dist directory if it doesn't exist
  if (!existsSync('dist')) {
    mkdirSync('dist');
  }
  
  if (!existsSync('dist/js')) {
    mkdirSync('dist/js', { recursive: true });
  }
  
  // Create a completely standalone HTML with inline JS for simplicity
  console.log('Creating ultra simple index.html...');
  
  // Create new index.html with CDN resources
  writeFileSync('dist/index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Dragon vs Knight</title>
    <style>
        body { 
            margin: 0; 
            background-color: #f0f0f0;
        }
    </style>
    <!-- Load libraries directly from CDN (guaranteed to work) -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.175.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.175.0/examples/js/controls/OrbitControls.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.175.0/examples/js/loaders/GLTFLoader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.175.0/examples/js/loaders/DRACOLoader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.min.js"></script>
  </head>
  <body>
    <!-- Load our app scripts -->
    <script src="./js/app.js"></script>
  </body>
</html>`);
  
  // Copy assets directory to dist/assets
  console.log('Copying assets directory...');
  if (!existsSync('dist/assets')) {
    mkdirSync('dist/assets', { recursive: true });
  }
  
  const copyDirectory = (source, target) => {
    if (!existsSync(target)) {
      mkdirSync(target, { recursive: true });
    }
    
    const files = readdirSync(source, { withFileTypes: true });
    
    for (const file of files) {
      const sourcePath = join(source, file.name);
      const targetPath = join(target, file.name);
      
      if (file.isDirectory()) {
        copyDirectory(sourcePath, targetPath);
      } else {
        copyFileSync(sourcePath, targetPath);
      }
    }
  };
  
  copyDirectory('assets', 'dist/assets');
  
  // Process shader files for inclusion in app.js
  let shaderCode = '';
  if (existsSync('shader')) {
    console.log('Processing shader files...');
    
    const shaderFiles = readdirSync('shader', { withFileTypes: true });
    for (const file of shaderFiles) {
      if (file.isFile() && file.name.endsWith('.js')) {
        // Process each shader file and prepare it for inclusion in app.js
        let content = readFileSync(join('shader', file.name), 'utf-8');
        // Replace all import statements
        content = content
          .replace(/import[^;]*;/g, '')
          .replace(/export[^;]*;/g, '')
          .replace(/('|")\/assets\//g, '$1./assets/')
          .replace(/('|")\/shader\//g, '$1./js/shader/');
          
        // Create shader class/code assignment
        shaderCode += `
// -------------------------
// From shader/${file.name}
// -------------------------
${content}

`;
      }
    }
    
    // Optional: Copy non-JS files like vertex/fragment shaders
    if (!existsSync('dist/js/shader')) {
      mkdirSync('dist/js/shader', { recursive: true });
    }
    
    for (const file of shaderFiles) {
      if (file.isFile() && !file.name.endsWith('.js')) {
        copyFileSync(join('shader', file.name), join('dist/js/shader', file.name));
      }
    }
  }
  
  // Process main.js and create app.js
  console.log('Creating simplified app.js...');
  
  let mainJs = readFileSync('main.js', 'utf-8');
  // Remove all import/export statements
  mainJs = mainJs
    .replace(/import[^;]*;/g, '')
    .replace(/export[^;]*;/g, '')
    .replace(/('|")\/assets\//g, '$1./assets/')
    .replace(/('|")\/shader\//g, '$1./js/shader/');
  
  // Create final app.js
  const finalAppJs = `
// ------------------------------
// Dragon Knight Application Code
// ------------------------------

// Shader Components
${shaderCode}

// Main Application
${mainJs}
`;

  writeFileSync('dist/js/app.js', finalAppJs);
  
  console.log('Ultra simple build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 