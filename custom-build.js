// Custom build script that avoids using Rollup
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

try {
  console.log('Starting custom build process...');
  
  // Create dist directory if it doesn't exist
  if (!existsSync('dist')) {
    mkdirSync('dist');
  }
  
  // Read original index.html
  const indexContent = readFileSync('index.html', 'utf-8');
  
  // Modify to point to the correct JS file
  const modifiedIndexContent = indexContent.replace(
    '<script type="module" src="/main.js"></script>',
    '<script type="module" src="./main.js"></script>'
  );
  
  // Write modified index.html to dist
  console.log('Creating modified index.html...');
  writeFileSync('dist/index.html', modifiedIndexContent);
  
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
  
  // Copy shader directory if it exists
  if (existsSync('shader')) {
    console.log('Copying shader directory...');
    copyDirectory('shader', 'dist/shader');
  }
  
  // Copy main.js to dist
  console.log('Copying main.js...');
  const mainJsContent = readFileSync('main.js', 'utf-8');
  
  // Modify main.js to use relative paths
  const modifiedMainJs = mainJsContent
    .replace(/('|")\/assets\//g, '$1./assets/')
    .replace(/('|")\/shader\//g, '$1./shader/');
  
  writeFileSync('dist/main.js', modifiedMainJs);
  
  console.log('Custom build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Custom build failed:', error);
  process.exit(1);
} 