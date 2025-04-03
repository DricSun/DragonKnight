// Static site build script optimized for Render
import { createRequire } from 'module';
import { writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

try {
  console.log('Starting Render optimized build process...');
  
  // Create dist directory if it doesn't exist
  if (!existsSync('dist')) {
    mkdirSync('dist');
  }
  
  // Copy assets directory to dist root for direct access
  console.log('Copying assets...');
  
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
  
  // Copy assets to both /assets and directly to dist for maximum compatibility
  if (!existsSync('dist/assets')) {
    mkdirSync('dist/assets', { recursive: true });
  }
  copyDirectory('assets', 'dist/assets');
  
  // Also copy GLB files directly to root
  console.log('Copying GLB files to root for direct access...');
  const assetFiles = readdirSync('assets', { withFileTypes: true });
  for (const file of assetFiles) {
    if (file.isFile() && (file.name.endsWith('.glb') || file.name.endsWith('.hdr'))) {
      copyFileSync(join('assets', file.name), join('dist', file.name));
    }
  }
  
  // Optional: Copy shader directory if it exists
  if (existsSync('shader')) {
    console.log('Copying shader directory...');
    copyDirectory('shader', 'dist/shader');
  }
  
  // Create index.html with inline script for Render
  console.log('Creating index.html for Render...');
  writeFileSync('dist/index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Dragon vs Knight</title>
  <style>
    body { 
      margin: 0; 
      background-color: #f0f0f0; 
      overflow: hidden;
    }
    #loading {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #000;
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    #loading progress {
      width: 70%;
      margin-top: 20px;
    }
  </style>
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
</head>
<body>
  <div id="loading">
    <h2>Loading Dragon Knight...</h2>
    <progress id="progress-bar" value="0" max="100"></progress>
    <p id="loading-status">Initializing...</p>
  </div>

  <script src="https://unpkg.com/three@0.175.0/build/three.min.js"></script>
  <script src="https://unpkg.com/three@0.175.0/examples/js/controls/OrbitControls.js"></script>
  <script src="https://unpkg.com/three@0.175.0/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://unpkg.com/three@0.175.0/examples/js/loaders/DRACOLoader.js"></script>
  <script src="https://unpkg.com/dat.gui@0.7.9/build/dat.gui.min.js"></script>

  <script>
    // Wait for resources to load
    window.addEventListener('DOMContentLoaded', function() {
      let scene, camera, renderer, controls;
      const loadingManager = new THREE.LoadingManager();
      const progressBar = document.getElementById('progress-bar');
      const loadingStatus = document.getElementById('loading-status');
      
      // Loading manager setup
      loadingManager.onProgress = function(url, loaded, total) {
        const percent = (loaded / total) * 100;
        progressBar.value = percent;
        loadingStatus.textContent = 'Loading: ' + url.split('/').pop() + ' (' + Math.round(percent) + '%)';
      };
      
      loadingManager.onLoad = function() {
        document.getElementById('loading').style.display = 'none';
        console.log('All resources loaded');
      };
      
      loadingManager.onError = function(url) {
        console.error('Error loading: ' + url);
        loadingStatus.textContent = 'Error loading: ' + url.split('/').pop();
      };

      // Initialize the scene
      init();
      
      // Load models
      loadModels();
      
      // Start animation loop
      animate();
      
      function init() {
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        
        // Camera setup
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 40);
        
        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);
        
        // Controls setup
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
      }
      
      function loadModels() {
        // GLTF loader setup
        const loader = new THREE.GLTFLoader(loadingManager);
        
        // Optional: Setup Draco loader for compressed models
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://unpkg.com/three@0.175.0/examples/js/libs/draco/');
        loader.setDRACOLoader(dracoLoader);
        
        // Try several possible paths to find the models
        const tryLoadModel = (modelName, callback) => {
          const paths = [
            '/' + modelName, // Direct at root
            '/assets/' + modelName, // In assets subdirectory
            './' + modelName, // Relative at root 
            './assets/' + modelName // Relative in assets subdirectory
          ];
          
          let loaded = false;
          
          // Try each path until one works
          function tryNextPath(index) {
            if (index >= paths.length) {
              console.error('Failed to load ' + modelName + ' from all paths');
              return;
            }
            
            const path = paths[index];
            console.log('Trying to load ' + modelName + ' from ' + path);
            
            loader.load(
              path,
              function(gltf) {
                if (!loaded) {
                  loaded = true;
                  console.log('Successfully loaded ' + modelName + ' from ' + path);
                  callback(gltf);
                }
              },
              undefined,
              function(error) {
                console.log('Failed to load ' + modelName + ' from ' + path + ': ' + error);
                tryNextPath(index + 1);
              }
            );
          }
          
          tryNextPath(0);
        };
        
        // Load dragon
        loadingStatus.textContent = 'Loading dragon...';
        tryLoadModel('black_dragon_with_idle_animation.glb', function(gltf) {
          const model = gltf.scene;
          model.scale.set(8, 8, 8);
          model.position.set(0, -14, 5);
          model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          scene.add(model);
          console.log('Dragon loaded successfully');
        });
        
        // Load knight
        loadingStatus.textContent = 'Loading knight...';
        tryLoadModel('artorias.glb', function(gltf) {
          const model = gltf.scene;
          model.scale.set(8, 8, 8);
          model.position.set(0, -14, 30);
          model.rotation.y = Math.PI; // Face the dragon
          model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          scene.add(model);
          console.log('Knight loaded successfully');
        });
        
        // Load temple
        loadingStatus.textContent = 'Loading temple...';
        tryLoadModel('aztec_temple.glb', function(gltf) {
          const model = gltf.scene;
          model.scale.set(0.2, 0.2, 0.2);
          model.position.set(0, -25, 0);
          model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          scene.add(model);
          console.log('Temple loaded successfully');
        });
      }
      
      function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      
      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
    });
  </script>
</body>
</html>`);
  
  // Create placeholder favicon to avoid 404 errors
  console.log('Creating favicon.ico...');
  writeFileSync('dist/favicon.ico', Buffer.from('00000100010010100000010020006804000016000000280000001000000020000000010020000000000000040000130b0000130b00000000000000000000', 'hex'));
  
  console.log('Render-optimized build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 