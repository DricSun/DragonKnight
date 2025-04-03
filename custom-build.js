// Custom build script that avoids using Rollup
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Function to fix imports in a file
const fixImports = (content) => {
  return content
    .replace(/from\s+['"]three['"]/g, "from '../three.module.js'")
    .replace(/from\s+['"]three\/examples\/jsm\/controls\/OrbitControls\.js['"]/g, "from '../controls/OrbitControls.js'")
    .replace(/from\s+['"]three\/examples\/jsm\/loaders\/GLTFLoader\.js['"]/g, "from '../loaders/GLTFLoader.js'")
    .replace(/from\s+['"]three\/examples\/jsm\/loaders\/DRACOLoader\.js['"]/g, "from '../loaders/DRACOLoader.js'")
    .replace(/from\s+['"]dat\.gui['"]/g, "from '../dat.gui.module.js'");
};

try {
  console.log('Starting custom build process...');
  
  // Create dist directory if it doesn't exist
  if (!existsSync('dist')) {
    mkdirSync('dist');
  }
  
  // Copy node_modules libs we need
  if (!existsSync('dist/lib')) {
    mkdirSync('dist/lib', { recursive: true });
  }
  
  // Copy three.js files
  console.log('Copying three.js modules...');
  writeFileSync('dist/lib/three.module.js', readFileSync('node_modules/three/build/three.module.js'));
  
  // Create the orbit controls file
  if (!existsSync('dist/lib/controls')) {
    mkdirSync('dist/lib/controls', { recursive: true });
  }
  
  // Copy and fix OrbitControls.js
  let orbitControlsContent = readFileSync('node_modules/three/examples/jsm/controls/OrbitControls.js', 'utf-8');
  orbitControlsContent = fixImports(orbitControlsContent);
  writeFileSync('dist/lib/controls/OrbitControls.js', orbitControlsContent);
  
  // Create the loaders directory
  if (!existsSync('dist/lib/loaders')) {
    mkdirSync('dist/lib/loaders', { recursive: true });
  }
  
  // Copy and fix GLTFLoader.js
  let gltfLoaderContent = readFileSync('node_modules/three/examples/jsm/loaders/GLTFLoader.js', 'utf-8');
  gltfLoaderContent = fixImports(gltfLoaderContent);
  writeFileSync('dist/lib/loaders/GLTFLoader.js', gltfLoaderContent);
  
  // Copy and fix DRACOLoader.js
  let dracoLoaderContent = readFileSync('node_modules/three/examples/jsm/loaders/DRACOLoader.js', 'utf-8');
  dracoLoaderContent = fixImports(dracoLoaderContent);
  writeFileSync('dist/lib/loaders/DRACOLoader.js', dracoLoaderContent);
  
  // Copy dat.gui
  writeFileSync('dist/lib/dat.gui.module.js', readFileSync('node_modules/dat.gui/build/dat.gui.module.js'));
  
  // Read original index.html
  const indexContent = readFileSync('index.html', 'utf-8');
  
  // Modify to point to the correct JS file
  const modifiedIndexContent = indexContent.replace(
    '<script type="module" src="/main.js"></script>',
    '<script type="module" src="./main-fixed.js"></script>'
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
  
  // Copy and fix shader directory if it exists
  if (existsSync('shader')) {
    console.log('Copying shader directory...');
    if (!existsSync('dist/shader')) {
      mkdirSync('dist/shader', { recursive: true });
    }
    
    // Copy shader files with import fixes
    const shaderFiles = readdirSync('shader', { withFileTypes: true });
    for (const file of shaderFiles) {
      if (file.isFile() && file.name.endsWith('.js')) {
        const content = readFileSync(join('shader', file.name), 'utf-8');
        const fixedContent = content
          .replace(/import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]/g, 'import * as THREE from "../lib/three.module.js"')
          .replace(/import\s+{\s*OrbitControls\s*}\s+from\s+['"]three\/examples\/jsm\/controls\/OrbitControls\.js['"]/g, 'import { OrbitControls } from "../lib/controls/OrbitControls.js"')
          .replace(/import\s+{\s*GLTFLoader\s*}\s+from\s+['"]three\/examples\/jsm\/loaders\/GLTFLoader\.js['"]/g, 'import { GLTFLoader } from "../lib/loaders/GLTFLoader.js"')
          .replace(/import\s+{\s*DRACOLoader\s*}\s+from\s+['"]three\/examples\/jsm\/loaders\/DRACOLoader\.js['"]/g, 'import { DRACOLoader } from "../lib/loaders/DRACOLoader.js"')
          .replace(/import\s+{\s*GUI\s*}\s+from\s+['"]dat\.gui['"]/g, 'import { GUI } from "../lib/dat.gui.module.js"')
          .replace(/('|")\/assets\//g, '$1../assets/')
          .replace(/('|")\/shader\//g, '$1../shader/');
        writeFileSync(join('dist/shader', file.name), fixedContent);
      } else if (file.isFile()) {
        copyFileSync(join('shader', file.name), join('dist/shader', file.name));
      }
    }
  }
  
  // Create a mapping file to fix imports
  console.log('Creating mapping wrapper...');
  writeFileSync('dist/main-fixed.js', `
// Import mapping wrapper
import * as THREE from './lib/three.module.js';
import { OrbitControls } from './lib/controls/OrbitControls.js';
import { GLTFLoader } from './lib/loaders/GLTFLoader.js';
import { DRACOLoader } from './lib/loaders/DRACOLoader.js';
import { GUI } from './lib/dat.gui.module.js';

// Make them available globally
window.THREE = THREE;
window.OrbitControls = OrbitControls;
window.GLTFLoader = GLTFLoader;
window.DRACOLoader = DRACOLoader;
window.GUI = GUI;

// Now import the main script
import './main.js';
  `);
  
  // Copy main.js to dist
  console.log('Copying main.js...');
  const mainJsContent = readFileSync('main.js', 'utf-8');
  
  // Modify main.js to use relative paths and fix imports
  const modifiedMainJs = mainJsContent
    .replace(/import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]/g, 'import * as THREE from "./lib/three.module.js"')
    .replace(/import\s+{\s*OrbitControls\s*}\s+from\s+['"]three\/examples\/jsm\/controls\/OrbitControls\.js['"]/g, 'import { OrbitControls } from "./lib/controls/OrbitControls.js"')
    .replace(/import\s+{\s*GLTFLoader\s*}\s+from\s+['"]three\/examples\/jsm\/loaders\/GLTFLoader\.js['"]/g, 'import { GLTFLoader } from "./lib/loaders/GLTFLoader.js"')
    .replace(/import\s+{\s*DRACOLoader\s*}\s+from\s+['"]three\/examples\/jsm\/loaders\/DRACOLoader\.js['"]/g, 'import { DRACOLoader } from "./lib/loaders/DRACOLoader.js"')
    .replace(/import\s+{\s*GUI\s*}\s+from\s+['"]dat\.gui['"]/g, 'import { GUI } from "./lib/dat.gui.module.js"')
    .replace(/('|")\/assets\//g, '$1./assets/')
    .replace(/('|")\/shader\//g, '$1./shader/');
  
  writeFileSync('dist/main.js', modifiedMainJs);
  
  console.log('Custom build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Custom build failed:', error);
  process.exit(1);
} 