/*
 * Copyright 2025 Christophe Bruchansky (Immersions Library Project)
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
             "aboutTextButton": "Label for the 'About' button in the UI.",
             "aboutLink": "URL for the 'About' section.",
             "fullText": "Label for the full version button in the UI.",
             "fullLink": "URL for the full version.",
             "completed": "Message displayed after collecting all items.",
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
            */
            const response = await fetch("/immersion-demo/demo.json");
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const demoData = await response.json();
            this.importData(demoData);
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
        var groundMaterial = new BABYLON.StandardMaterial("ground", this); // custom ground material
        groundMaterial.alpha = 1;
        groundMaterial.diffuseColor = new BABYLON.Color3(0.941, 0.772, 0.239);
        this.setGroundMaterial(groundMaterial);

        /*  REGULAR BABYLONJS LIGHTS  */
        var light0 = new BABYLON.HemisphericLight(
            "light0",
            new BABYLON.Vector3(0, 0, -1),
            this,
        );
        light0.intensity = 0.5;
        light0.specular = new BABYLON.Color3(1, 0.607, 0.2);
        light0.diffuse = new BABYLON.Color3(1, 1, 1);
        light0.groundColor = new BABYLON.Color3(0, 0, 1);
        var light1 = new BABYLON.DirectionalLight(
            "light1",
            new BABYLON.Vector3(-2, -1, -1),
            this,
        );
        light1.intensity = 3;
        light1.diffuse = new BABYLON.Color3(0.415, 0.894, 0.345);
        light1.specular = new BABYLON.Color3(0.415, 0.894, 0.345);
        var light2 = new BABYLON.DirectionalLight(
            "light2",
            new BABYLON.Vector3(-0.5, -1, 2),
            this,
        );
        light2.intensity = 2;
        light2.diffuse = new BABYLON.Color3(0.894, 0.345, 0.345);
        light2.specular = new BABYLON.Color3(0.894, 0.345, 0.345);

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
        this.gl = new BABYLON.GlowLayer("glow", this);
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

 

        var scene = this;

        // This is how to load a sound file and attach it to a stand
        var loading_sound1 = this.assetsManager.addBinaryFileTask(
            "sound1",
            "/immersion-demo/assets/welcome.mp3",
        );
        loading_sound1.onSuccess = function (task) {
            scene.attachSound("soundDisplay", task.data);
        };

        // this is how to load a 3D scan and attach it to a plinth
        var loading_rock = this.assetsManager.addMeshTask(
            "loading_rock",
            "",
            "assets/rock/",
            "textured.obj",
        );
        loading_rock.onSuccess = function (task) {
            var rock1 = task.loadedMeshes[0].clone();
            rock1.scalingDeterminant = 0.15;
            rock1.rotationQuaternion = null;
            rock1.position = new BABYLON.Vector3(0, -0.115, -0.01);
            rock1.hidingDistance = 20; // so that the immersion does not display the rock when it is far away
            scene.attachMesh("exhibitPlinth", rock1);
        };

        // this is how to load a 3D model in babylonjs
        var loading_model = this.assetsManager.addMeshTask(
            "loading_model",
            "",
            "/immersion-demo/assets/",
            "demo.gltf",
        );
        loading_model.onSuccess = function (task) {
            var model = task.loadedMeshes[0];
            model.scalingDeterminant = 1;
            model.rotationQuaternion = null;
            model.rotation.y = BABYLON.Tools.ToRadians(90);
            model.position = new BABYLON.Vector3(0, 0, 0);
            scene.attachMesh("customPlinth", model);
        };

        // this is how to load a sound file and attach it to a plinth
        var loading_sound2 = this.assetsManager.addBinaryFileTask(
            "sound2",
            "/immersion-demo/assets/art.mp3",
        );
        loading_sound2.onSuccess = function (task) {
            scene.attachSound("customPlinth", task.data);
        };

        // this is how to load a sound file and attach it to a audio plinth
        var loading_sound3 = this.assetsManager.addBinaryFileTask(
            "sound3",
            "assets/open.mp3",
        );
        loading_sound3.onSuccess = function (task) {
            scene.attachSound("soundPlinth", task.data);
        };

        /* ADD BACKGROUND SOUND TO IMMERSION */
        var bg = this.assetsManager.addBinaryFileTask(
            "bg",
            "/immersion-demo/assets/bg.m4a",
        );
        bg.onSuccess = function (task) {
            scene.addSound(task.data, new BABYLON.Vector3(-50, 1.5, -77), 400); // parameters: sound data, origin of the sound, how far the sound is heard from
        };

        /*   ADD POINT AND CLICK ASSETS TO IMMERSION */
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
            sphere.position = new BABYLON.Vector3(c - 52, 1.8, -77);
            sphere.animations = [];
            sphere.animations.push(rotationAnim);
            sphere.animations.push(rotationAnim2);
            sphere.anim = this.beginAnimation(sphere, 0, 600, true);
            sphere.isAnimated = true;
            spheres.push(sphere);
            if (c == 1) {
                // first sphere rotation can be paused
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
                // second sphere hides a collectable and a third sphere
                sphere.isVisible = false;
                scene.hiddenSphere = sphere;
                sphere.actionManager = this.addInteraction(sphere, true); // apply default roll over effect and add a collectable
                sphere.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(
                        BABYLON.ActionManager.OnPickTrigger,
                        (evt) => {
                            console.log(scene.hiddenSphere);
                            if (sphere.isAnimated) sphere.anim.pause();
                            else sphere.anim.restart();
                            sphere.isAnimated = !sphere.isAnimated;
                        },
                    ),
                );
            } else if (c == 3) {
                // thirs sphere hides a collectable
                sphere.actionManager = this.addInteraction(sphere, true); // add a collectable (in total two with the previous sphere)
                sphere.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(
                        BABYLON.ActionManager.OnPickTrigger,
                        (evt) => {
                            scene.hiddenSphere.isVisible = true;
                            if (sphere.isAnimated) sphere.anim.pause();
                            else sphere.anim.restart();
                            sphere.isAnimated = !sphere.isAnimated;
                        },
                    ),
                );
            }
        }

        /*   REGULAR ASSETS    */
        // wall
        const myShape = [
            new BABYLON.Vector3(-58.5, 0, -91),
            new BABYLON.Vector3(-54, 0, -91),
            new BABYLON.Vector3(-54, 0, -100),
            new BABYLON.Vector3(-53.5, 0, -100),
            new BABYLON.Vector3(-53.5, 0, -90),
            new BABYLON.Vector3(-58, 0, -90),
            new BABYLON.Vector3(-58, 0, -60),
            new BABYLON.Vector3(-58.5, 0, -60),
        ];
        var wall = BABYLON.MeshBuilder.ExtrudePolygon(
            "wall",
            { shape: myShape, depth: 3 },
            this,
        );
        wall.position.y = 3;
        wall.material = this.buildingMaterial;

        // giant sphere appearing at the entrance
        let sphere = BABYLON.MeshBuilder.CreatePolyhedron("sphere-neon", {
            size: 7,
            type: 3,
        });
        sphere.material = this.frameMaterial;
        sphere.position = new BABYLON.Vector3(0, 8, -140);
        sphere.animations = [];
        sphere.animations.push(rotationAnim);
        sphere.animations.push(rotationAnim2);
        sphere.anim = this.beginAnimation(sphere, 0, 600, true);
    }

    // called when all items have been unlocked
    doWhenAllUnlocked(){
    }
}
