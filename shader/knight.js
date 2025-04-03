import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class Knight {
    constructor(scene, dragon) {
        this.scene = scene;
        this.dragon = dragon;
        this.model = null;
        this.mixer = null;
        this.walkAction = null;
        this.runAction = null;
        this.attackAction = null;
        this.group = null;
        this.isAttacking = false;
        this.keys = {};
        this.moveSpeed = 0.2;
        this.runSpeed = 0.4;
        
        
        this.load();
        
      
        this.setupEventListeners();
    }
    
    load() {
        const loader = new GLTFLoader();
        loader.load('assets/artorias.glb', (gltf) => {
            this.group = new THREE.Group();
            this.scene.add(this.group);

            this.model = gltf.scene;
            this.group.add(this.model);

            this.group.scale.set(8, 8, 8);
            this.group.position.set(0, -14, 30);
            this.group.rotation.y = Math.PI;

            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.mixer = new THREE.AnimationMixer(this.model);

           
            console.log("Animations disponibles :");
            gltf.animations.forEach((anim, index) => {
                console.log(`${index + 1}: ${anim.name}`);
            });

           
            const walkClip = gltf.animations.find(anim => anim.name.toLowerCase().includes("walk"));
            if (walkClip) {
                this.walkAction = this.mixer.clipAction(walkClip);
                this.walkAction.setLoop(THREE.LoopRepeat);
                this.walkAction.clampWhenFinished = false;
            }

            
            const runClip = gltf.animations.find(anim => anim.name === "[Action Stash].002");
            if (runClip) {
                this.runAction = this.mixer.clipAction(runClip);
                this.runAction.setLoop(THREE.LoopRepeat);
            }

            
            const attackClip = gltf.animations.find(anim => anim.name === "[Action Stash].003");
            if (attackClip) {
                this.attackAction = this.mixer.clipAction(attackClip);
                this.attackAction.setLoop(THREE.LoopOnce);
                this.attackAction.clampWhenFinished = true;
                this.mixer.addEventListener('finished', (e) => {
                    if (e.action === this.attackAction) {
                        this.isAttacking = false;
                    }
                });
            }

        }, undefined, (error) => console.error('Erreur chargement chevalier', error));
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    
    handleKeyDown(event) {
        this.keys[event.key.toLowerCase()] = true;
        if (event.key.toLowerCase() === 'a' && this.attackAction && !this.attackAction.isRunning()) {
            this.attack();
        }
    }
    
    handleKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;
    }
    
    attack() {
        if (!this.attackAction || this.isAttacking) return;
        
        this.attackAction.reset().play();
        this.isAttacking = true;
        
       
        if (this.isCloseEnoughToDragon()) {
            const damage = this.dragon.calculateDamage();
            this.dragon.takeDamage(damage);
        }
    }
    
   
    isCloseEnoughToDragon() {
        if (!this.group || !this.dragon || !this.dragon.model) return false;
        
        const distanceThreshold = 30; 
        
        const knightPosition = new THREE.Vector3();
        this.group.getWorldPosition(knightPosition);
        
        const dragonPosition = this.dragon.getPosition();
        if (!dragonPosition) return false;
        
        const distance = knightPosition.distanceTo(dragonPosition);
        return distance <= distanceThreshold;
    }
    
   
    updateMovement() {
        if (!this.group || !this.runAction) return;

        let moveX = 0, moveZ = 0;
        let rotationAngle = null;
        let isMoving = false;

      
        if (this.keys['q']) { 
            moveX = -this.moveSpeed; 
            rotationAngle = -Math.PI / 2; 
            isMoving = true;
        }
        if (this.keys['d']) { 
            moveX = this.moveSpeed; 
            rotationAngle = Math.PI / 2; 
            isMoving = true;
        }
        if (this.keys['z']) { 
            moveZ = -this.moveSpeed; 
            rotationAngle = Math.PI; 
            isMoving = true;
        }
        if (this.keys['s']) { 
            moveZ = this.moveSpeed; 
            rotationAngle = 0; 
            isMoving = true;
        }


        this.group.position.x += moveX;
        this.group.position.z += moveZ;


        if (rotationAngle !== null) {
            this.group.rotation.y = rotationAngle;
        }

        if (isMoving) {
            if (!this.runAction.isRunning()) {
                this.runAction.reset().play(); 
            }
        } else {
            if (this.runAction.isRunning()) {
                this.runAction.stop(); 
            }
        }
    }
    
    update(deltaTime) {
        this.updateMovement();
        if (this.mixer) this.mixer.update(deltaTime);
    }
}