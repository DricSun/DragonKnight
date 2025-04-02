import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { GUI } from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { Raycaster } from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Charger le ciel HDR
const rgbeLoader = new RGBELoader();
rgbeLoader.load('assets/sky.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
});

// Lumières
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

// Sol invisible
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -25.1;
ground.receiveShadow = true;
scene.add(ground);

// Charger le temple aztèque
const loaderTemple = new GLTFLoader();
loaderTemple.load('assets/aztec_temple.glb', (gltf) => {
    const templeModel = gltf.scene;
    templeModel.scale.set(0.2, 0.2, 0.2);
    templeModel.position.set(0, -25, 0);
    templeModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(templeModel);
}, undefined, (error) => console.error('Erreur chargement temple', error));

// Charger le dragon
const loaderDragon = new GLTFLoader();
let dragonModel = null, dragonMixer = null, dragonAnimation = null;

loaderDragon.load('assets/black_dragon_with_idle_animation.glb', (gltf) => {
    dragonModel = gltf.scene;
    dragonModel.scale.set(8, 8, 8);
    dragonModel.position.set(0, -14, 5);

    // Traverse tous les enfants du modèle dragon
    dragonModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Si le nom du mesh est 'Plane_Material_0', on le rend invisible
            if (child.name === 'Plane_Material_0') {
                child.visible = false;  // Masque ce mesh
            }
        }
    });

    // Animation du dragon
    if (gltf.animations.length > 0) {
        dragonMixer = new THREE.AnimationMixer(dragonModel);
        dragonAnimation = dragonMixer.clipAction(gltf.animations[0]);
        dragonAnimation.setLoop(THREE.LoopOnce);
        dragonAnimation.clampWhenFinished = true;
    }

    scene.add(dragonModel);
}, undefined, (error) => console.error('Erreur chargement dragon', error));

// Raycaster pour détecter les clics de souris
const raycaster = new Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', onMouseClick, false);
function onMouseClick(event) {
    // Calculer la position de la souris dans le système de coordonnées normalisées (-1 à +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Mettre à jour le raycaster avec la position de la souris
    raycaster.setFromCamera(mouse, camera);

    // Vérifier les intersections
    const intersects = raycaster.intersectObject(dragonModel, true);

    if (intersects.length > 0) {
        console.log("Dragon cliqué !");

        // Lancer l'animation du dragon si disponible
        if (dragonAnimation) {
            dragonAnimation.reset().play();
            dragonAnimation.timeScale = 0.5;
        }
    }
}




// Charger le chevalier (knight4)
const loaderKnight = new GLTFLoader();
let knightModel = null, knightMixer = null, walkAction = null, attackAction = null;
let knightGroup = null;

loaderKnight.load('assets/knight4.glb', (gltf) => {
    knightGroup = new THREE.Group();
    scene.add(knightGroup);

    knightModel = gltf.scene;
    knightGroup.add(knightModel);

    // Réduire la taille du chevalier
    knightGroup.scale.set(1, 1, 1); // Réduire la taille du chevalier

    knightGroup.position.set(0, -5, 30);
    knightGroup.rotation.y = Math.PI;

    knightModel.traverse((child) => {
        if (child.isMesh) {
            console.log(child.material);
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    knightMixer = new THREE.AnimationMixer(knightModel);

    // Charger l'animation de marche
    const walkClip = gltf.animations.find(anim => anim.name.toLowerCase().includes("walk"));
    if (walkClip) {
        walkAction = knightMixer.clipAction(walkClip);
        walkAction.setLoop(THREE.LoopRepeat);
        walkAction.clampWhenFinished = false;
    }

    // Charger l'animation d'attaque
    const attackClip = gltf.animations.find(anim => anim.name.toLowerCase().includes("attack"));
    if (attackClip) {
        attackAction = knightMixer.clipAction(attackClip);
        attackAction.setLoop(THREE.LoopOnce);
        attackAction.clampWhenFinished = true;
    }
}, undefined, (error) => console.error('Erreur chargement chevalier', error));

// Déplacement du chevalier
const keys = {};
const moveSpeed = 0.2;
window.addEventListener('keydown', (event) => { keys[event.key.toLowerCase()] = true; });
window.addEventListener('keyup', (event) => { keys[event.key.toLowerCase()] = false; });

function updateKnightMovement() {
    if (!knightGroup || !walkAction) return;

    let moveX = 0, moveZ = 0;
    let rotationAngle = null;
    let isMoving = false;

    if (keys['q']) { 
        moveX = -moveSpeed; 
        rotationAngle = -Math.PI / 2;
        isMoving = true;
    }
    if (keys['d']) { 
        moveX = moveSpeed; 
        rotationAngle = Math.PI / 2;
        isMoving = true;
    }
    if (keys['z']) { 
        moveZ = -moveSpeed; 
        rotationAngle = Math.PI;
        isMoving = true;
    }
    if (keys['s']) { 
        moveZ = moveSpeed; 
        rotationAngle = 0;
        isMoving = true;
    }

    knightGroup.position.x += moveX;
    knightGroup.position.z += moveZ;

    if (rotationAngle !== null) {
        knightGroup.rotation.y = rotationAngle;
    }

    // Gestion de l'animation de marche
    if (isMoving && !walkAction.isRunning()) {
        walkAction.reset().play();
    } else if (!isMoving && walkAction.isRunning()) {
        walkAction.stop();
    }

    // Gérer l'attaque avec la touche "A"
    if (keys['a'] && !attackAction.isRunning()) {
        attackAction.reset().play();
    }
}

// GUI
const gui = new GUI();
gui.add(light, 'intensity', 0, 5, 0.01).name('Point Light Intensity');

// Position caméra
camera.position.set(0, 3, 10);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);

// Animation
function animate() {
    requestAnimationFrame(animate);
    updateKnightMovement();

    if (knightMixer) knightMixer.update(0.016);
    if (dragonMixer) dragonMixer.update(0.016);

    controls.update();
    renderer.render(scene, camera);
}

animate();
