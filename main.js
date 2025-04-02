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
let dragonHealth = 1000; // Points de vie du dragon

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
let isAttacking = false; // Variable pour suivre si le chevalier est en train d'attaquer

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
        
        // Ajouter un événement à la fin de l'animation d'attaque
        knightMixer.addEventListener('finished', (e) => {
            if (e.action === attackAction) {
                isAttacking = false;
            }
        });
    }

}, undefined, (error) => console.error('Erreur chargement chevalier', error));

// Système pour afficher les dégâts
const damageTextPool = [];
const activeDamageTexts = [];

// Créer un pool de textes de dégâts réutilisables
function createDamageTextPool(size) {
    for (let i = 0; i < size; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 50;
        const context = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(5, 2.5, 1);
        sprite.visible = false;
        scene.add(sprite);

        damageTextPool.push({
            sprite: sprite,
            canvas: canvas,
            context: context,
            inUse: false
        });
    }
}

// Afficher un texte de dégâts à une position spécifique
function showDamageText(damage, position) {
    // Chercher un texte non utilisé dans le pool
    let damageText = damageTextPool.find(dt => !dt.inUse);
    if (!damageText) return; // Si tous sont utilisés

    // Marquer comme utilisé
    damageText.inUse = true;
    
    // Configurer le texte sur le canvas
    const ctx = damageText.context;
    ctx.clearRect(0, 0, damageText.canvas.width, damageText.canvas.height);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(damage.toString(), damageText.canvas.width / 2, damageText.canvas.height / 2);
    
    // Mettre à jour la texture
    damageText.sprite.material.map.needsUpdate = true;
    
    // Positionner et rendre visible
    damageText.sprite.position.copy(position);
    damageText.sprite.position.y += 5; // Placer au-dessus du dragon
    damageText.sprite.visible = true;
    
    // Ajouter aux textes actifs avec une durée de vie
    activeDamageTexts.push({
        damageText: damageText,
        createdAt: Date.now(),
        lifespan: 1000, // Durée de vie en ms
        startY: damageText.sprite.position.y
    });
}

// Mettre à jour les textes de dégâts (mouvement, transparence, durée de vie)
function updateDamageTexts() {
    const now = Date.now();
    
    for (let i = activeDamageTexts.length - 1; i >= 0; i--) {
        const dt = activeDamageTexts[i];
        const age = now - dt.createdAt;
        
        if (age >= dt.lifespan) {
            // Supprimer le texte s'il est trop vieux
            dt.damageText.sprite.visible = false;
            dt.damageText.inUse = false;
            activeDamageTexts.splice(i, 1);
        } else {
            // Mettre à jour la position et l'opacité
            const progress = age / dt.lifespan;
            dt.damageText.sprite.position.y = dt.startY + progress * 3; // Flotter vers le haut
            
            // Rendre transparent progressivement
            const material = dt.damageText.sprite.material;
            material.opacity = 1 - progress;
            material.needsUpdate = true;
        }
    }
}

// Créer le pool de textes de dégâts
createDamageTextPool(10);

// Calcul de dégâts aléatoires
function calculateDamage() {
    // Dégâts entre 50 et 150
    return Math.floor(Math.random() * 101) + 50;
}

// Fonction pour vérifier si le chevalier est assez proche du dragon pour l'attaquer
function isKnightCloseEnoughToDragon() {
    if (!knightGroup || !dragonModel) return false;
    
    const distanceThreshold = 30; // Distance maximale pour que l'attaque touche
    
    const knightPosition = new THREE.Vector3();
    knightGroup.getWorldPosition(knightPosition);
    
    const dragonPosition = new THREE.Vector3();
    dragonModel.getWorldPosition(dragonPosition);
    
    const distance = knightPosition.distanceTo(dragonPosition);
    return distance <= distanceThreshold;
}

window.addEventListener('keydown', (event) => { 
    keys[event.key.toLowerCase()] = true;
    if (event.key.toLowerCase() === 'a' && attackAction && !attackAction.isRunning()) {
        attackAction.reset().play(); // Jouer l'attaque si l'animation n'est pas déjà en cours
        isAttacking = true;
        
        // Vérifier si l'attaque touche le dragon
        if (isKnightCloseEnoughToDragon()) {
            const damage = calculateDamage();
            dragonHealth -= damage;
            
            // Afficher les dégâts au-dessus du dragon
            const dragonPosition = new THREE.Vector3();
            dragonModel.getWorldPosition(dragonPosition);
            showDamageText(damage, dragonPosition);
            
            // Animer le dragon s'il est touché
            if (dragonAnimation && !dragonAnimation.isRunning()) {
                dragonAnimation.reset().play();
            }
            
            console.log(`Dégâts infligés: ${damage}, PV dragon restants: ${dragonHealth}`);
            
            // Optionnel: Ajouter une logique si le dragon est vaincu
            if (dragonHealth <= 0) {
                console.log("Le dragon est vaincu!");
                // Ajoutez ici une logique pour la défaite du dragon
            }
        }
    }
});

window.addEventListener('keyup', (event) => { 
    keys[event.key.toLowerCase()] = false;
});

// Déplacement du chevalier
const keys = {};
const moveSpeed = 0.2;
const runSpeed = 0.4;  // Vitesse de course

// Raycaster pour détecter les clics sur le dragon
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Gestionnaire d'événement pour le clic de souris
window.addEventListener('click', (event) => {
    // Convertir les coordonnées de la souris en coordonnées normalisées (-1 à +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    // Mettre à jour le raycaster avec la position de la souris et de la caméra
    raycaster.setFromCamera(mouse, camera);
    
    // Vérifier si le dragon est cliqué
    if (dragonModel) {
        const intersects = raycaster.intersectObject(dragonModel, true);
        
        if (intersects.length > 0) {
            console.log("Dragon cliqué !");
            // Jouer l'animation du dragon
            if (dragonAnimation && !dragonAnimation.isRunning()) {
                dragonAnimation.reset().play();
            }
        }
    }
});

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

// Créer des éléments d'interface pour afficher les PV du dragon
const healthBarContainer = document.createElement('div');
healthBarContainer.style.position = 'absolute';
healthBarContainer.style.top = '20px';
healthBarContainer.style.left = '20px';
healthBarContainer.style.width = '200px';
healthBarContainer.style.backgroundColor = '#333';
healthBarContainer.style.padding = '5px';
healthBarContainer.style.borderRadius = '5px';

const healthBarLabel = document.createElement('div');
healthBarLabel.style.color = 'white';
healthBarLabel.style.marginBottom = '5px';
healthBarLabel.textContent = 'Dragon HP: 1000/1000';

const healthBarOuter = document.createElement('div');
healthBarOuter.style.width = '100%';
healthBarOuter.style.height = '20px';
healthBarOuter.style.backgroundColor = '#555';
healthBarOuter.style.borderRadius = '3px';

const healthBarInner = document.createElement('div');
healthBarInner.style.width = '100%';
healthBarInner.style.height = '100%';
healthBarInner.style.backgroundColor = 'red';
healthBarInner.style.borderRadius = '3px';
healthBarInner.style.transition = 'width 0.3s';

healthBarOuter.appendChild(healthBarInner);
healthBarContainer.appendChild(healthBarLabel);
healthBarContainer.appendChild(healthBarOuter);
document.body.appendChild(healthBarContainer);

// Mettre à jour la barre de vie
function updateHealthBar() {
    if (dragonHealth <= 0) dragonHealth = 0;
    const healthPercentage = (dragonHealth / 1000) * 100;
    healthBarInner.style.width = healthPercentage + '%';
    healthBarLabel.textContent = `Dragon HP: ${dragonHealth}/1000`;
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
    updateDamageTexts();
    updateHealthBar();

    if (knightMixer) knightMixer.update(0.016);
    if (dragonMixer) dragonMixer.update(0.016);

    controls.update();
    renderer.render(scene, camera);
}

animate();