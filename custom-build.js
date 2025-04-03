// Static site build script optimized for Render with embedded assets
import { createRequire } from 'module';
import { writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

try {
  console.log('Starting Render build process with CDN assets...');
  
  // Create dist directory if it doesn't exist
  if (!existsSync('dist')) {
    mkdirSync('dist');
  }
  
  // Create index.html with CDN-hosted models for Render
  console.log('Creating index.html with external models...');
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
  <link rel="icon" href="data:;base64,iVBORw0KGgo=">
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
    // Using hosted 3D models from reliable CDN service
    const MODELS = {
      dragon: 'https://models.readyplayer.me/64fa0336d1a68dae71a2c86e.glb',
      knight: 'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/knight/model.gltf',
      temple: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/aztec-temple/model.gltf'
    };

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
        
        // Load dragon (using a public dragon model)
        loadingStatus.textContent = 'Loading dragon...';
        loader.load(MODELS.dragon, function(gltf) {
          const model = gltf.scene;
          model.scale.set(5, 5, 5);
          model.position.set(0, -10, 5);
          model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          scene.add(model);
          console.log('Dragon loaded successfully');
        });
        
        // Load knight (using a public knight model)
        loadingStatus.textContent = 'Loading knight...';
        loader.load(MODELS.knight, function(gltf) {
          const model = gltf.scene;
          model.scale.set(5, 5, 5);
          model.position.set(0, -10, 20);
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
        
        // Load temple (using a public temple model)
        loadingStatus.textContent = 'Loading temple...';
        loader.load(MODELS.temple, function(gltf) {
          const model = gltf.scene;
          model.scale.set(8, 8, 8);
          model.position.set(0, -20, 0);
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
  
  console.log('Render-optimized build with CDN assets completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 