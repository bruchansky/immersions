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
     * @param {boolean} [options.locked] - Whether the exhibit starts locked (regular mode only)
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
        const scaling = options.depth / 0.05;
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

        // locked plinth: reveal button (regular mode only — other modes act as normal Display)
        if (options.locked && MODE !== "screenshot" && MODE !== "cinematic" && !DEST) {
            this.locked = true;
            if (this.exhibitMesh) {
                this.exhibitMesh.isVisible = false;
                this.exhibitMesh.getChildMeshes().forEach(c => { c.isVisible = false; });
            }

            this.revealLinkBack = BABYLON.MeshBuilder.CreateBox("revealBack", {
                height: 0.06,
                width: 0.18,
                depth: 0.02,
            });
            this.revealLinkBack.parent = this.plinth;
            this.revealLinkBack.material = this.styleMaterial;
            this.revealLinkBack.position = new BABYLON.Vector3(
                0,
                this.height / 2 - 0.05,
                -this.depth / 2 - 0.001,
            );
            this.revealLink = BABYLON.MeshBuilder.CreatePlane("revealButton", {
                height: 0.06,
                width: 0.18,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE,
            });
            this.revealLink.parent = this.plinth;
            this.revealLink.position = new BABYLON.Vector3(
                0,
                this.height / 2 - 0.05,
                -this.depth / 2 - 0.012,
            );
            this.revealLink.isPickable = false;
            this.revealLinkTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
                this.revealLink,
                360,
                120,
            );
            this.revealLinkTexture.background = "black";
            this.revealButton = BABYLON.GUI.Button.CreateSimpleButton("revealButton", "");
            this.revealButton.fontSize = 35;
            this.revealButton.height = "120px";
            this.revealButton.width = "360px";
            this.revealButton.fontFamily = this.fontName;
            this.revealButton.cornerRadius = 0;
            this.revealButton.color = "#555555";
            this.revealButton.thickness = 5;
            this.revealButton.background = "black";
            this.revealButton.textBlock.text = scene.texts.reveal;
            this.revealButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            this.revealLinkTexture.addControl(this.revealButton);
            scene.highlight(this.revealLink);

            this.revealButton.onPointerUpObservable.add(() => { this._pressReveal(); });

            this.revealLinkBack.isVisible = false;
            this.revealLink.isVisible = false;
            this.revealButton.isVisible = false;
        }
    }

    /**
     * Activates the locked plinth so the exhibit can be revealed.
     * Has no effect in screenshot, cinematic, or destination modes.
     *
     * @param {boolean} [revealButton=true] - If true, enables the reveal button for the user to press.
     *   If false, skips the button and immediately reveals the exhibit.
     * @memberof Plinth
     */
    unlock(revealButton = true) {
        if (this.revealLink) {
            this.revealLink.isPickable = true;
            this.revealButton.color = "white";
        }
        if (!revealButton) this._pressReveal();
    }

    /**
     * Plays the success sound, closes the text window if open, hides the reveal button,
     * and pops the exhibit after a short delay.
     * @memberof Plinth
     */
    _pressReveal() {
        if (!MUTE) new Audio(this.scene.soundsp.success).play();
        this.locked = false;
        if (this.standWindowBack && this.standWindowBack.scaling.y == 1) this.windowSwitch();
        this.revealLinkBack.isVisible = false;
        this.revealLink.isVisible = false;
        this.revealButton.isVisible = false;
        setTimeout(() => { this._popExhibit(); }, 400);
    }

    /**
     * Pops the exhibit with a scale-up/down bounce and a sphere burst effect.
     * The exhibit remains visible after the animation.
     *
     * @memberof Plinth
     */
    _popExhibit() {
        const m = this.exhibitMesh;
        if (!m) return;
        if (this._exhibitIsChild) {
            m.getChildMeshes().forEach(c => { c.isVisible = true; });
        } else {
            m.isVisible = true;
        }
        const origScale = m.scaling.clone();
        const popAnim = new BABYLON.Animation(
            "exhibitPop", "scaling", 60,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        );
        popAnim.setKeys([
            { frame: 0, value: origScale },
            { frame: 16, value: origScale.scale(1.5) },
            { frame: 32, value: origScale },
        ]);
        const bounceEase = new BABYLON.ElasticEase(1, 3);
        bounceEase.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
        popAnim.setEasingFunction(bounceEase);
        this.scene.beginDirectAnimation(m, [popAnim], 0, 32, false);
        const { min, max } = m.getHierarchyBoundingVectors(true);
        const radius = BABYLON.Vector3.Distance(min, max) / 2;
        const center = BABYLON.Vector3.Center(min, max);
        const burst = BABYLON.MeshBuilder.CreateSphere("popBurst", { diameter: radius * 4.5, segments: 8 }, this.scene);
        burst.position = center;
        const burstMat = new BABYLON.StandardMaterial("popBurstMat", this.scene);
        burstMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        burstMat.alpha = 0.5;
        burstMat.disableLighting = true;
        burstMat.backFaceCulling = false;
        burst.material = burstMat;
        const burstFadeAnim = new BABYLON.Animation(
            "burstFade", "visibility", 60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        );
        burstFadeAnim.setKeys([{ frame: 0, value: 0.5 }, { frame: 20, value: 0 }]);
        this.scene.beginDirectAnimation(burst, [burstFadeAnim], 0, 20, false, 1, () => { burst.dispose(); });
    }

    doWhenArriving() {
        super.doWhenArriving();
        if (this.revealLinkBack && this.locked && MODE !== "screenshot" && MODE !== "cinematic" && !DEST) {
            this.revealLinkBack.isVisible = true;
            this.revealLink.isVisible = true;
            this.revealButton.isVisible = true;
        }
    }

    doWhenLeaving() {
        super.doWhenLeaving();
        if (this.revealLinkBack) {
            this.revealLinkBack.isVisible = false;
            this.revealLink.isVisible = false;
            this.revealButton.isVisible = false;
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
        this._exhibitIsChild = true;
        if (this.locked) {
            exhibit.isVisible = false;
            exhibit.getChildMeshes().forEach(c => { c.isVisible = false; });
        }
    }
}
