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

// Déplacement du chevalier (knight4)
const loaderKnight = new GLTFLoader();
let knightModel = null, knightMixer = null, walkAction = null, runAction = null, attackAction = null;
let knightGroup = null;

loaderKnight.load('assets/artorias.glb', (gltf) => {
    knightGroup = new THREE.Group();
    scene.add(knightGroup);

    knightModel = gltf.scene;
    knightGroup.add(knightModel);

    knightGroup.scale.set(8, 8, 8);
    knightGroup.position.set(0, -14, 30);
    knightGroup.rotation.y = Math.PI;

    knightModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    knightMixer = new THREE.AnimationMixer(knightModel);

    // Affichage des animations dans la console
    console.log("Animations disponibles :");
    gltf.animations.forEach((anim, index) => {
        console.log(`${index + 1}: ${anim.name}`);
    });

    // Charger l'animation de marche (si elle existe)
    const walkClip = gltf.animations.find(anim => anim.name.toLowerCase().includes("walk"));
    if (walkClip) {
        walkAction = knightMixer.clipAction(walkClip);
        walkAction.setLoop(THREE.LoopRepeat);
        walkAction.clampWhenFinished = false;
    }

    // Charger l'animation de course avec le nom exact "[Action Stash].002"
    const runClip = gltf.animations.find(anim => anim.name === "[Action Stash].002");
    if (runClip) {
        runAction = knightMixer.clipAction(runClip);
        runAction.setLoop(THREE.LoopRepeat);
    }

    // Charger l'animation d'attaque
    const attackClip = gltf.animations.find(anim => anim.name === "[Action Stash].003");
    if (attackClip) {
        attackAction = knightMixer.clipAction(attackClip);
        attackAction.setLoop(THREE.LoopOnce);
        attackAction.clampWhenFinished = true;

    }

}, undefined, (error) => console.error('Erreur chargement chevalier', error));

window.addEventListener('keydown', (event) => { 
    keys[event.key.toLowerCase()] = true;
    if (event.key.toLowerCase() === 'a' && attackAction && !attackAction.isRunning()) {
        attackAction.reset().play(); // Jouer l'attaque si l'animation n'est pas déjà en cours
    }
});
window.addEventListener('keyup', (event) => { 
    keys[event.key.toLowerCase()] = false;
});

// Déplacement du chevalier
const keys = {};
const moveSpeed = 0.2;
const runSpeed = 0.4;  // Vitesse de course
window.addEventListener('keydown', (event) => { keys[event.key.toLowerCase()] = true; });
window.addEventListener('keyup', (event) => { keys[event.key.toLowerCase()] = false; });



// Fonction de mise à jour du mouvement du chevalier
function updateKnightMovement() {
    if (!knightGroup || !runAction) return;

    let moveX = 0, moveZ = 0;
    let rotationAngle = null;
    let isMoving = false;

    // Déplacement avec les touches
    if (keys['q']) { 
        moveX = -moveSpeed; 
        rotationAngle = -Math.PI / 2; // rotation vers la gauche
        isMoving = true;
    }
    if (keys['d']) { 
        moveX = moveSpeed; 
        rotationAngle = Math.PI / 2; // rotation vers la droite
        isMoving = true;
    }
    if (keys['z']) { 
        moveZ = -moveSpeed; 
        rotationAngle = Math.PI; // rotation vers l'avant
        isMoving = true;
    }
    if (keys['s']) { 
        moveZ = moveSpeed; 
        rotationAngle = 0; // rotation vers l'arrière
        isMoving = true;
    }

    // Appliquer le mouvement
    knightGroup.position.x += moveX;
    knightGroup.position.z += moveZ;

    // Appliquer la rotation si une direction est donnée
    if (rotationAngle !== null) {
        knightGroup.rotation.y = rotationAngle;
    }

    // Jouer l'animation de course si le personnage est en mouvement
    if (isMoving) {
        if (!runAction.isRunning()) {
            runAction.reset().play(); // Lancer l'animation de course si ce n'est pas déjà fait
        }
    } else {
        if (runAction.isRunning()) {
            runAction.stop(); // Arrêter l'animation si le personnage ne se déplace pas
        }
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
