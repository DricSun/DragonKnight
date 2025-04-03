// Custom build script for regular scripts (no modules)
import { createRequire } from 'module';
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
  
  // Copy libraries as non-module scripts
  if (!existsSync('dist/js')) {
    mkdirSync('dist/js', { recursive: true });
  }
  
  // Copy Three.js (non-module version)
  console.log('Copying three.js libraries...');
  writeFileSync('dist/js/three.min.js', readFileSync('node_modules/three/build/three.min.js'));
  
  // Copy OrbitControls
  writeFileSync('dist/js/OrbitControls.js', readFileSync('node_modules/three/examples/js/controls/OrbitControls.js'));
  
  // Copy GLTFLoader
  writeFileSync('dist/js/GLTFLoader.js', readFileSync('node_modules/three/examples/js/loaders/GLTFLoader.js'));
  
  // Copy DRACOLoader
  writeFileSync('dist/js/DRACOLoader.js', readFileSync('node_modules/three/examples/js/loaders/DRACOLoader.js'));
  
  // Copy dat.gui
  writeFileSync('dist/js/dat.gui.min.js', readFileSync('node_modules/dat.gui/build/dat.gui.min.js'));
  
  // Create a new index.html with non-module scripts
  console.log('Creating modified index.html...');
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
    <!-- Load libraries as regular scripts -->
    <script src="./js/three.min.js"></script>
    <script src="./js/OrbitControls.js"></script>
    <script src="./js/GLTFLoader.js"></script>
    <script src="./js/DRACOLoader.js"></script>
    <script src="./js/dat.gui.min.js"></script>
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
  
  // Convert all module files to a single non-module script
  console.log('Creating combined app.js script...');
  
  // Read main.js
  const mainJsContent = readFileSync('main.js', 'utf-8')
    .replace(/import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]/g, '// THREE is global')
    .replace(/import\s+{\s*OrbitControls\s*}\s+from\s+['"]three\/examples\/jsm\/controls\/OrbitControls\.js['"]/g, '// OrbitControls is global')
    .replace(/import\s+{\s*GLTFLoader\s*}\s+from\s+['"]three\/examples\/jsm\/loaders\/GLTFLoader\.js['"]/g, '// GLTFLoader is global')
    .replace(/import\s+{\s*DRACOLoader\s*}\s+from\s+['"]three\/examples\/jsm\/loaders\/DRACOLoader\.js['"]/g, '// DRACOLoader is global')
    .replace(/import\s+{\s*GUI\s*}\s+from\s+['"]dat\.gui['"]/g, '// GUI is global')
    .replace(/('|")\/assets\//g, '$1./assets/')
    .replace(/('|")\/shader\//g, '$1./js/shader/');
  
  // Combine shader files if they exist
  let shaderJs = '';
  if (existsSync('shader')) {
    console.log('Copying shader directory...');
    
    // Create dist/js/shader directory
    if (!existsSync('dist/js/shader')) {
      mkdirSync('dist/js/shader', { recursive: true });
    }
    
    // Read all shader files
    const shaderFiles = readdirSync('shader', { withFileTypes: true });
    for (const file of shaderFiles) {
      if (file.isFile() && file.name.endsWith('.js')) {
        let content = readFileSync(join('shader', file.name), 'utf-8')
          .replace(/import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]/g, '// THREE is global')
          .replace(/import\s+{\s*OrbitControls\s*}\s+from\s+['"]three\/examples\/jsm\/controls\/OrbitControls\.js['"]/g, '// OrbitControls is global')
          .replace(/import\s+{\s*GLTFLoader\s*}\s+from\s+['"]three\/examples\/jsm\/loaders\/GLTFLoader\.js['"]/g, '// GLTFLoader is global')
          .replace(/import\s+{\s*DRACOLoader\s*}\s+from\s+['"]three\/examples\/jsm\/loaders\/DRACOLoader\.js['"]/g, '// DRACOLoader is global')
          .replace(/import\s+{\s*GUI\s*}\s+from\s+['"]dat\.gui['"]/g, '// GUI is global')
          .replace(/('|")\/assets\//g, '$1../assets/')
          .replace(/('|")\/shader\//g, '$1./');
        
        content = `// From shader/${file.name}\n${content}\n\n`;
        writeFileSync(join('dist/js/shader', file.name), content);
      } else if (file.isFile()) {
        copyFileSync(join('shader', file.name), join('dist/js/shader', file.name));
      }
    }
  }
  
  // Write the combined app.js
  writeFileSync('dist/js/app.js', `// Combined application script
${mainJsContent}
`);
  
  console.log('Custom build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Custom build failed:', error);
  process.exit(1);
} 