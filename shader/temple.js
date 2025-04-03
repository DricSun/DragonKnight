import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class Temple {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        
        // Créer le sol invisible
        this.createGround();
        
        // Charger le modèle
        this.load();
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -25.1;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }
    
    load() {
        const loader = new GLTFLoader();
        loader.load('assets/aztec_temple.glb', (gltf) => {
            this.model = gltf.scene;
            this.model.scale.set(0.2, 0.2, 0.2);
            this.model.position.set(0, -25, 0);
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.scene.add(this.model);
        }, undefined, (error) => console.error('Erreur chargement temple', error));
    }
}