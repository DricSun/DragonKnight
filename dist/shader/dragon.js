import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class Dragon {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        this.mixer = null;
        this.animation = null;
        this.health = 1000;
        this.damageTextPool = [];
        this.activeDamageTexts = [];
        
        
        this.createDamageTextPool(10);
        
        
        this.createHealthBar();
        
        
        this.load();
    }
    
    load() {
        const loader = new GLTFLoader();
        loader.load('../assets/black_dragon_with_idle_animation.glb', (gltf) => {
            this.model = gltf.scene;
            this.model.scale.set(8, 8, 8);
            this.model.position.set(0, -14, 5);

            
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    
                    if (child.name === 'Plane_Material_0') {
                        child.visible = false;  // Masque ce mesh
                    }
                }
            });

            
            if (gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.model);
                this.animation = this.mixer.clipAction(gltf.animations[0]);
                this.animation.setLoop(THREE.LoopOnce);
                this.animation.clampWhenFinished = true;
            }

            this.scene.add(this.model);
        }, undefined, (error) => console.error('Erreur chargement dragon', error));
    }
    
    
    createDamageTextPool(size) {
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
            this.scene.add(sprite);

            this.damageTextPool.push({
                sprite: sprite,
                canvas: canvas,
                context: context,
                inUse: false
            });
        }
    }
    
    
    showDamageText(damage, position) {
        // Chercher un texte non utilisé dans le pool
        let damageText = this.damageTextPool.find(dt => !dt.inUse);
        if (!damageText) return; // Si tous sont utilisés

        
        damageText.inUse = true;
        
        
        const ctx = damageText.context;
        ctx.clearRect(0, 0, damageText.canvas.width, damageText.canvas.height);
        ctx.fillStyle = 'rgba(255, 0, 0, 1)';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(damage.toString(), damageText.canvas.width / 2, damageText.canvas.height / 2);
        
       
        damageText.sprite.material.map.needsUpdate = true;
        
        // Positionner et rendre visible
        damageText.sprite.position.copy(position);
        damageText.sprite.position.y += 5; 
        damageText.sprite.visible = true;
        
        
        this.activeDamageTexts.push({
            damageText: damageText,
            createdAt: Date.now(),
            lifespan: 1000, // Durée de vie en ms
            startY: damageText.sprite.position.y
        });
    }
    
    
    updateDamageTexts() {
        const now = Date.now();
        
        for (let i = this.activeDamageTexts.length - 1; i >= 0; i--) {
            const dt = this.activeDamageTexts[i];
            const age = now - dt.createdAt;
            
            if (age >= dt.lifespan) {
                dt.damageText.sprite.visible = false;
                dt.damageText.inUse = false;
                this.activeDamageTexts.splice(i, 1);
            } else {
                
                const progress = age / dt.lifespan;
                dt.damageText.sprite.position.y = dt.startY + progress * 3; // Flotter vers le haut
                
                
                const material = dt.damageText.sprite.material;
                material.opacity = 1 - progress;
                material.needsUpdate = true;
            }
        }
    }
    
    
    calculateDamage() {
        // Dégâts entre 50 et 150
        return Math.floor(Math.random() * 101) + 50;
    }
    
    
    createHealthBar() {
        this.healthBarContainer = document.createElement('div');
        this.healthBarContainer.style.position = 'absolute';
        this.healthBarContainer.style.top = '20px';
        this.healthBarContainer.style.left = '20px';
        this.healthBarContainer.style.width = '200px';
        this.healthBarContainer.style.backgroundColor = '#333';
        this.healthBarContainer.style.padding = '5px';
        this.healthBarContainer.style.borderRadius = '5px';

        this.healthBarLabel = document.createElement('div');
        this.healthBarLabel.style.color = 'white';
        this.healthBarLabel.style.marginBottom = '5px';
        this.healthBarLabel.textContent = 'Dragon HP: 1000/1000';

        this.healthBarOuter = document.createElement('div');
        this.healthBarOuter.style.width = '100%';
        this.healthBarOuter.style.height = '20px';
        this.healthBarOuter.style.backgroundColor = '#555';
        this.healthBarOuter.style.borderRadius = '3px';

        this.healthBarInner = document.createElement('div');
        this.healthBarInner.style.width = '100%';
        this.healthBarInner.style.height = '100%';
        this.healthBarInner.style.backgroundColor = 'red';
        this.healthBarInner.style.borderRadius = '3px';
        this.healthBarInner.style.transition = 'width 0.3s';

        this.healthBarOuter.appendChild(this.healthBarInner);
        this.healthBarContainer.appendChild(this.healthBarLabel);
        this.healthBarContainer.appendChild(this.healthBarOuter);
        document.body.appendChild(this.healthBarContainer);
    }
    
    
    updateHealthBar() {
        if (this.health <= 0) this.health = 0;
        const healthPercentage = (this.health / 1000) * 100;
        this.healthBarInner.style.width = healthPercentage + '%';
        this.healthBarLabel.textContent = `Dragon HP: ${this.health}/1000`;
        
        
        if (this.health <= 0) {
            console.log("Le dragon est vaincu!");
            
        }
    }
    
    
    takeDamage(damage) {
        this.health -= damage;
        
        
        const dragonPosition = new THREE.Vector3();
        this.model.getWorldPosition(dragonPosition);
        this.showDamageText(damage, dragonPosition);
        
        
        if (this.animation && !this.animation.isRunning()) {
            this.animation.reset().play();
        }
        
        console.log(`Dégâts infligés: ${damage}, PV dragon restants: ${this.health}`);
        this.updateHealthBar();
    }
    
    getPosition() {
        if (!this.model) return null;
        const position = new THREE.Vector3();
        this.model.getWorldPosition(position);
        return position;
    }
    
    update(deltaTime) {
        if (this.mixer) this.mixer.update(deltaTime);
        this.updateDamageTexts();
        this.updateHealthBar();
    }
}