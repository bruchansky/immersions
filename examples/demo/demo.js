/*
 * Copyright 2026 Christophe Bruchansky (Immersions Library Project)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 *
 * See the NOTICE file for attribution requirements.
 */

/* CONVENTIONS */
// x axe goes right, y axe goes up, z axe goes forward
// Rotations are counterclockwise
class MyImmersion extends Immersion {
    async init() {
        try {
           /* Documentation for JSON variables used in demoData

           This data is utilized throughout the MyImmersion class to configure and
           manage the text and navigation.

           The demo file is mostly self-explanatory.
           Here is the definition of some of the variables:
             "aboutTextButton" and "aboutLink": UI button to customise with project homepage,
             "exitText" and "exitLink": UI button set to open source library by default
             "fullText" and "fullLink": UI button to customise for full immersion, only shown with 'dest' URL parameter,
             "type": "Type of the stand: stand, display, plinth, teleporter, or link.
                        A display is a stand with some descrption,
                        a plinth is a display with some 3D model exhibit",
             "style": "Stand style: 'light', 'dark', 'lightwireframe', or 'darkwireframe'.",
             "windowOpened": "Indicates if the text window of a stand is opened by default.",
             "gate": "ID of the teleporter destination.",
             "sound": "How sound is played: onpress or autoplay.",
             "loop": "Boolean indicating if the sound should loop.",
             "factorSound": "Sound volume multiplier.",
             "lineFrom": "Draws a line to the stand with the given ID.",
             "exhibit": "Indicates if the plinth has an exhibit model (model loads later).",
             "rotationE": "Boolean indicating if the plinth exhibit rotates.",
             "locked": "In case a Plinth exhibit or Link is hidden by default",
             "durationInSec" : "Used in cinematic mode to define how long to stay on a stand",
             "subtitles" : "Used in cinematic mode to define if descriptions should be displayed as subtitles",
             "vrSide" : "Optional horizontal offset (number) applied to the display window when entering VR, so that Displays are not on the way."
            */
            const response = await fetch("/immersion_engine/examples/demo/demo.json");
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const demoData = await response.json();
            this.importData(demoData);
            this.setupShadows(this.shadowGenerator,true); // to cast stand shadows and whether displaying them on ground or not
        } catch (e) {
            console.error("Error fetching demo data:", e);
            console.error("Error details:", e.message, e.stack);
        }
    }

    constructor(engine) {
        const config = {
            viewHeight: 1.75,
            skyboxSize: 2000,
            skyColor: new BABYLON.Color3(0.941, 0.772, 0.239),
            fogDensity: 0.05,
            fogColor: new BABYLON.Color3(1, 1, 1),
            groundSize: 2002,
            groundShadows: false
        };
        super("demo", "light", engine, config); // style of your UI: either "light" or "dark" (default)

        /*  REGULAR BABYLONJS LIGHTS & SHADOWS  */
        var light0 = new BABYLON.HemisphericLight(
            "light0",
            new BABYLON.Vector3(0, 0, -1),
            this,
        );
        light0.intensity = 0.5;
        light0.specular = new BABYLON.Color3(1, 0.607, 0.2);
        light0.diffuse = new BABYLON.Color3(1, 1, 1);
        light0.groundColor = new BABYLON.Color3(0, 0, 1);
        var shadowLight = new BABYLON.DirectionalLight(
            "shadowLight",
            new BABYLON.Vector3(-300, -900, 100),
            this
        );
        shadowLight.intensity = 2;
        shadowLight.diffuse = new BABYLON.Color3(1, 1, 1);
        shadowLight.specular = new BABYLON.Color3(0.894, 0.345, 0.345);
        var groundMaterial = new BABYLON.StandardMaterial("ground", this); // custom ground material
        groundMaterial.alpha = 0.2;
        groundMaterial.diffuseColor = new BABYLON.Color3(0.941, 0.772, 0.239);
        this.setGroundMaterial(groundMaterial);
        this.shadowGenerator = new BABYLON.ShadowGenerator(2048, shadowLight);
        this.shadowGenerator.useExponentialShadowMap = true;

        /*   REGULAR BABYLONJS MATERIALS    */
        this.stoneM = new BABYLON.StandardMaterial("stone", this);
        this.stoneM.diffuseColor = new BABYLON.Color3(0.156, 0.843, 0.721);
        this.stoneM.ambientColor = new BABYLON.Color3(0.156, 0.843, 0.721);
        this.buildingMaterial = new BABYLON.StandardMaterial("building", this);
        this.buildingMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.buildingMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
        this.frameMaterial = new BABYLON.StandardMaterial("frame", this);
        this.frameMaterial.wireframe = true;
        this.frameMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.frameMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
        this.gl = new BABYLON.GlowLayer("glow", this); // glowing effects
        this.gl.customEmissiveColorSelector = function (
            mesh,
            subMesh,
            material,
            result,
        ) {
            if (mesh.name.includes("neon")) {
                result.set(1, 1, 1, 1);
            } else {
                result.set(0, 0, 0, 0);
            }
        };


        // 3D MESHES ////////////////////////////////////////////////
        // regular scene mesh
        let sphere = BABYLON.MeshBuilder.CreatePolyhedron("sphere-neon", {
            size: 7,
            type: 3,
        });
        sphere.material = this.frameMaterial;
        sphere.position = new BABYLON.Vector3(0, 20, 20);

        // This is how to load a mesh and attach it to a plinth
        var loading_rock = this.assetsManager.addMeshTask(
            "loading_rock",
            "",
            "/immersion_engine/examples/demo/assets/rock/",
            "textured.obj",
        );
        loading_rock.onSuccess = (task) => {
            var rock1 = task.loadedMeshes[0];
            rock1.scalingDeterminant = 0.15;
            rock1.rotationQuaternion = null;
            rock1.position = new BABYLON.Vector3(0, -0.115, -0.01);
            rock1.hidingDistance = 20; // hide when camera is far away
            this.attachMesh("exhibitPlinth", rock1);
            this.addShadowCasters(rock1); // to add rock shawow to the ground
        };

        var loading_art = this.assetsManager.addMeshTask(
            "loading_art",
            "",
            "/immersion_engine/examples/demo/assets/demo.gltf",
        );
        loading_art.onSuccess = (task) => {
            var art1 = task.loadedMeshes[0];
            art1.scalingDeterminant = 0.8;
            art1.rotationQuaternion = null;
            art1.rotation.y = Math.PI / 2;
            art1.position = new BABYLON.Vector3(0, 0, 0);
            art1.hidingDistance = 20; // hide when camera is far away
            this.attachMesh("lockedPlinth", art1);
            this.addShadowCasters(art1); 
        };

        // SOUND ////////////////////////////////////////////////
        // scene sound
        var bg = this.assetsManager.addBinaryFileTask(
            "bg",
            "/immersion_engine/examples/demo/assets/bg.m4a",
        );
        bg.onSuccess = (task) => {
            this.addSound(task.data, new BABYLON.Vector3(25, 1.5, 7), 400); // parameters: sound data, origin, how far the sound is heard from
        };

        // This is how to load a sound file and attach it to a stand (sound: "onpress")
        var loading_sound1 = this.assetsManager.addBinaryFileTask(
            "sound1",
            "/immersion_engine/examples/demo/assets/welcome.mp3",
        );
        loading_sound1.onSuccess = (task) => {
            this.attachSound("soundDisplay", task.data);
        };

        // This is how to load a sound file and attach it to an audio-only plinth (no exhibit)
        var loading_sound_plinth = this.assetsManager.addBinaryFileTask(
            "sound_plinth",
            "/immersion_engine/examples/demo/assets/open.mp3",
        );
        loading_sound_plinth.onSuccess = (task) => {
            this.attachSound("audioPlinth", task.data);
        };

        // POINT & CLICK + COLLECTABLES ////////////////////////////////////////////////
        // 3 spheres that have different interaction mechanisms
        const rotationAnim = new BABYLON.Animation(
            "rotationAnim",
            "rotation.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
        );
        const rotationAnim2 = new BABYLON.Animation(
            "rotationAnim2",
            "rotation.x",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
        );
        const keys = [];
        keys.push({ frame: 0, value: 0 });
        keys.push({ frame: 300, value: 2 * Math.PI });
        rotationAnim.setKeys(keys);
        rotationAnim2.setKeys(keys);
        var spheres = [];
        for (let c = 1; c < 4; c++) {
            let sphere = BABYLON.MeshBuilder.CreatePolyhedron("sphere" + c, {
                size: 0.3,
                type: 3,
            });
            sphere.material = this.stoneM.clone();
            sphere.position = new BABYLON.Vector3(c-2, 1.8, 5);
            sphere.animations = [];
            sphere.animations.push(rotationAnim);
            sphere.animations.push(rotationAnim2);
            sphere.anim = this.beginAnimation(sphere, 0, 600, true);
            sphere.isAnimated = true;
            spheres.push(sphere);
            if (c == 1) {
                // first sphere rotation can be paused and restarted
                sphere.actionManager = this.addInteraction(sphere, false); // apply default roll over effect
                sphere.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(
                        BABYLON.ActionManager.OnPickTrigger,
                        (evt) => {
                            if (sphere.isAnimated) sphere.anim.pause();
                            else sphere.anim.restart();
                            sphere.isAnimated = !sphere.isAnimated;
                        },
                    ),
                );
            } else if (c == 2) {
                // second sphere hides a collectable and disappears when clicked
                sphere.actionManager = this.addInteraction(sphere, true); // apply default roll over effect and add a collectable
            } else if (c == 3) {
                // third sphere hides a collectable; it can only be clicked when on game Plinth, and it doesn't disappear when clicked
                sphere.actionManager = this.addInteraction(sphere, true, "lockedPlinth", false); 
            }
        }
    }

    // to easily cast complex mesh shadows
    addShadowCasters(model, maxRadius = 200) {
    if (!this.shadowGenerator) return;
        model.getChildMeshes(false).forEach(m => {
        if (m.getBoundingInfo().boundingSphere.radiusWorld < maxRadius)
            this.shadowGenerator.addShadowCaster(m);
        });
    }

    // called when all items have been unlocked
    doWhenAllUnlocked(){
        // reveal the locked plinth exhibit with a button for the user to press
        const locked = this.findStandByName("lockedPlinth");
        if (locked) locked.unlock();
        // reveal the locked link
        const lockedLink = this.findStandByName("lockedLink");
        if (lockedLink) lockedLink.unlock();
    }
}
