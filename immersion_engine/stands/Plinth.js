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

/**
 * Specialized display stands for showcasing 3D exhibit meshes.
 * Extends Display with support for 3D object exhibition and rotation.
 *
 * @class Plinth
 * @extends Display
 * @since 0.1.0
 */
class Plinth extends Display {
    /**
     * Creates a new Plinth instance.
     *
     * @param {string} name - The name identifier for this plinth
     * @param {Object} options - Configuration options extending Display options
     * @param {BABYLON.Mesh|boolean} [options.exhibit] - true if an exhibit is meant to be attached
     * @param {boolean} [options.rotationE] - Whether to rotate the exhibit
     * @param {BABYLON.Scene} scene - The BabylonJS scene instance
     * @memberof Plinth
     */
    constructor(name, options, scene) {
        if (options.width == null) options.width = 0.3;
        if (options.height == null) options.height = 1.25;
        if (options.depth == null) options.depth = 0.3;
        if (options.distance == null) options.distance = 0.7 + options.depth;
        if (options.text == null) options.text = scene.texts.plinth;
        super(name, options, scene);
        if (options.exhibit) this.exhibitMesh = options.exhibit;
        if (options.rotationE) this.rotationE = options.rotationE;
        this.plinth.isVisible = true;
        this.plinthBase.isVisible = true;
        var scaling = options.depth / 0.05;
        if (this.standWindowBack) this.standWindowBack.scaling.z = scaling;
        // creates exhibit mesh
        if (this.exhibitMesh) {
            if (this.exhibitMesh == true)
                this.exhibitMesh = BABYLON.MeshBuilder.CreateBox(
                    "exhibitMesh",
                    { height: 0.2, width: 0.2, depth: 0.2 },
                );
            this.exhibitMesh.parent = this.plinth;
            this.exhibitMesh.position = new BABYLON.Vector3(
                0,
                this.height / 2 + 0.23,
                0,
            );
            this.exhibitMesh.rotation.y = BABYLON.Tools.ToRadians(90);
            if (this.rotationE == true) this.rotateExhibit();
            const matrix = this.exhibitMesh.computeWorldMatrix(true);
            const global_position = BABYLON.Vector3.TransformCoordinates(
                this.exhibitMesh.position,
                matrix,
            );
            this.lookingAt.x = global_position.x;
            this.lookingAt.z = global_position.z;
            // creates a sound icon if no exhibit but some sound attached to the plinth
        } else if (this.sound) {
            if (this.exhibitMesh == null) {
                this.soundBox = BABYLON.MeshBuilder.CreateCylinder("cylinder", {
                    diameterTop: 0.24,
                    diameterBottom: 0.02,
                    height: 0.08,
                });
                this.soundBox.parent = this.plinth;
                this.soundBox.material = this.styleMaterial;
                this.soundBox.position = new BABYLON.Vector3(
                    0,
                    this.height / 2 + 0.18,
                    0,
                );
                this.soundBall = BABYLON.MeshBuilder.CreateSphere("sphere", {
                    diameter: 0.12,
                    slice: 0.4,
                });
                this.soundBall.parent = this.plinth;
                this.soundBall.material = this.styleMaterial;
                this.soundBall.position = new BABYLON.Vector3(
                    0,
                    this.height / 2 + 0.21,
                    0,
                );
            }
        }
    }

    /**
     * Toggles rotation animation for the exhibit mesh.
     * Can start, pause, or resume the rotation animation based on current state.
     *
     * @memberof Plinth
     */
    rotateExhibit() {
        if (this.animatable && this.animatable.animationStarted == false)
            this.animatable.restart();
        else if (this.animatable && this.animatable.animationStarted == true)
            this.animatable.pause();
        else {
            this.exhibitMeshAnim = new BABYLON.Animation(
                "exhibitAnim",
                "rotation.y",
                30,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
            );
            this.exhibitMeshKeys = [];
            this.exhibitMeshKeys.push({ frame: 0, value: 0 });
            this.exhibitMeshKeys.push({ frame: 300, value: 2 * Math.PI });
            this.exhibitMeshAnim.setKeys(this.exhibitMeshKeys);
            this.exhibitMesh.animations = [];
            this.exhibitMesh.animations.push(this.exhibitMeshAnim);
            this.animatable = this.scene.beginAnimation(
                this.exhibitMesh,
                0,
                300,
                true,
            );
        }
    }

    /**
     * Assigns a loaded 3D mesh as the exhibit for this plinth.
     * The exhibit becomes a child of the plinth's exhibit mesh container.
     *
     * @param {BABYLON.Mesh} exhibit - The 3D mesh to display as an exhibit
     * @memberof Plinth
     */
    setExhibit(exhibit) {
        exhibit.parent = this.exhibitMesh;
        this.exhibitMesh.isVisible = false;
    }
} 
