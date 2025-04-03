import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { GUI } from 'dat.gui';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { Dragon } from '/shader/dragon.js';
import { Knight } from '/shader/knight.js';
import { Temple } from '/shader/temple.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);


const rgbeLoader = new RGBELoader();
rgbeLoader.load('assets/sky.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
});


setupLights();


const temple = new Temple(scene);
const dragon = new Dragon(scene);
const knight = new Knight(scene, dragon);


setupRaycaster();


camera.position.set(0, 3, 10);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);


const gui = new GUI();
const pointLight = scene.getObjectByProperty('isPointLight', true);
if (pointLight) {
    gui.add(pointLight, 'intensity', 0, 5, 0.01).name('Point Light Intensity');
}


let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);
    
    const deltaTime = (time - lastTime) * 0.001; // convertir en secondes
    lastTime = time;
    
    
    if (knight) knight.update(deltaTime);
    if (dragon) dragon.update(deltaTime);
    
    controls.update();
    renderer.render(scene, camera);
}

animate(0); 


function setupLights() {
    // Lumière ponctuelle
    const light = new THREE.PointLight(0xffffff, 2, 100);
    light.position.set(10, 10, 10);
    light.castShadow = true;
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x606060, 1.5);
    scene.add(ambientLight);


    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-5, 20, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);


    const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 1.2);
    scene.add(hemisphereLight);
}


function setupRaycaster() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();


    window.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        

        raycaster.setFromCamera(mouse, camera);
        

        if (dragon.model) {
            const intersects = raycaster.intersectObject(dragon.model, true);
            
            if (intersects.length > 0) {
                console.log("Dragon cliqué !");
                // Jouer l'animation du dragon
                if (dragon.animation && !dragon.animation.isRunning()) {
                    dragon.animation.reset().play();
                }
            }
        }
    });
}