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
 * Base class for interactive navigation elements in 3D immersions.
 * Stands serve as viewpoints, plinths, displays, and other interactive elements.
 *
 * @class Stand
 * @extends BABYLON.TransformNode
 * @since 0.1.0
 */
// Stand class definition
class Stand extends BABYLON.TransformNode {
    /**
     * Creates a new Stand instance.
     *
     * @param {string} name - The name identifier for this stand
     * @param {Object} options - Configuration options for the stand
     * @param {BABYLON.Vector3} [options.position] - 3D position of the stand
     * @param {string} [options.text] - Text label for the stand
     * @param {string} [options.style="light"] - Visual style ("light", "dark", "lightwireframe", "darkwireframe")
     * @param {BABYLON.Vector3} [options.lookingAt] - Direction the stand faces
     * @param {string} [options.lineFrom] - Name of stand to draw connecting line from
     * @param {boolean} [options.animationActivated] - Whether animations are enabled
     * @param {BABYLON.Scene} scene - The BabylonJS scene instance
     * @memberof Stand
     */
    constructor(name, options, scene) {
        /* General stand properties */
        super(name);
        this.scene = scene;
        if (options.lineFrom !== null && options.lineFrom)
            this.lineFrom = options.lineFrom;
        if (options.position !== null && options.position)
            this.position = options.position;
        if (options.text !== null && options.text) this.text = options.text;
        else this.text = scene.texts.stand;
        if (options.style !== null && options.style) this.style = options.style;
        else this.style = "light"; // only if sound
        if (options.lookingAt !== null) this.lookingAt = options.lookingAt;
        else this.lookingAt = new BABYLON.Vector3(0, 0, 0);
        if (options.animationActivated !== null)
            this.animationActivated = options.animationActivated;
        if (options.durationInSec != null) this.durationInSec = options.durationInSec;
        if (options.subtitle) this.subtitle = options.subtitle;

        // Positions the stand properly
        let angleDeg =
            (Math.atan2(
                -this.position.x + this.lookingAt.x,
                -this.position.z + this.lookingAt.z,
            ) *
                180) /
            Math.PI;
        this.rotation.y = BABYLON.Tools.ToRadians(angleDeg);
        this.position.y = 0.05;
        this.direction = this.lookingAt;

        // Creates the base of the stand
        this.standBase = BABYLON.MeshBuilder.CreateCylinder("standBase", {
            diameter: 0.8,
            height: 0.07,
        });
        this.standBase.applyFog = false;
        this.standBase.parent = this;
        this.standBase.hidingDistance = 500;

        // Highlights the stand base when pointed

        let standBase = this.standBase;
        standBase.stand = this;
        standBase.material = scene.standMaterial
        // Performs tasks when arriving on the stand
        standBase.standName = this.name;
        standBase.isActive = false;
        standBase.calledOnEveryFrame = (scene) => {
            if (
                standBase.parent.position
                    .subtract(scene.activeCamera.position)
                    .length() < 2.8 &&
                standBase.isActive == false
            ) {
                if (scene.inXR == true)
                    scene.setCurrentStand(standBase.stand.name); // in case the user moved to the stand without clicking anything (VR mode)
                standBase.isActive = true;
                standBase.stand.doWhenArriving();
            } else if (
                standBase.parent.position
                    .subtract(scene.activeCamera.position)
                    .length() >= 2.8 &&
                standBase.isActive == true
            ) {
                standBase.isActive = false;
                standBase.stand.doWhenLeaving();
            }
        };

        // Draw lines between stands if specified
        if (this.lineFrom) {
            let positionFrom = scene.findStandByName(this.lineFrom);
            if (positionFrom) {
                this.standPoints = [
                    new BABYLON.Vector3(this.position.x, 0, this.position.z),
                    positionFrom.position,
                ];
                this.standLines = BABYLON.MeshBuilder.CreateLines(
                    "standLines",
                    { points: this.standPoints },
                );
                this.standLines.position.y = 0.02;
                //this.standLines.enableEdgesRendering();
                //this.standLines.edgesWidth = 2.0;
                this.standLines.material = scene.lineMaterial;
                this.standLines.isPickable = false;
            }
        }

        this.standSign = BABYLON.MeshBuilder.CreatePolyhedron("standBox", {
            size: 0.35,
            type: 3,
        });
        this.standSign.material = scene.standMaterial;
        this.standSign.hidingDistance = 500;
        this.standSign.applyFog = false;
        const rotationAnim = new BABYLON.Animation(
            "rotationAnim",
            "rotation.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
        );
        const keys = [];
        keys.push({ frame: 0, value: 0 });
        keys.push({ frame: 300, value: 2 * Math.PI });
        rotationAnim.setKeys(keys);
        this.standSign.animations = [];
        this.standSign.animations.push(rotationAnim);
        this.standSign.anim = scene.beginAnimation(
            this.standSign,
            0,
            600,
            true,
        );
        this.standSign.parent = this;
        this.standSign.position = new BABYLON.Vector3(0, 0.45, 0);
        // Highlights sign when pointed
        let standSign = this.standSign;
        standSign.stand = this;
        const baseScale = new BABYLON.Vector3(1, 1, 1);
        const hoverScale = new BABYLON.Vector3(1.1, 1.1, 1.1);
        let actionManager = scene.highlight(standSign);
        actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOverTrigger,
                function () {
                    const growAnim = new BABYLON.Animation("signHoverIn", "scaling", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    growAnim.setKeys([{ frame: 0, value: standSign.scaling.clone() }, { frame: 8, value: hoverScale }]);
                    scene.beginDirectAnimation(standSign, [growAnim], 0, 8, false);
                }
            )
        );
        actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOutTrigger,
                function () {
                    const shrinkAnim = new BABYLON.Animation("signHoverOut", "scaling", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    shrinkAnim.setKeys([{ frame: 0, value: standSign.scaling.clone() }, { frame: 8, value: baseScale }]);
                    scene.beginDirectAnimation(standSign, [shrinkAnim], 0, 8, false);
                }
            )
        );
        const action = actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                function (ev) {
                    standSign.material = scene.selectionMaterial;
                    standSign.clicked = true;
                    scene.setCurrentStand(standBase.stand.name);
                },
            ),
        );
        standSign.clickAction = action;
        this.standSignText = BABYLON.MeshBuilder.CreatePlane("standSignText", {
            height: 0.7,
            width: 0.7,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        });
        this.standSignText.position = new BABYLON.Vector3(0, 0.47, -0.45);
        this.standSignText.material = scene.interfaceMaterial;
        this.standSignText.isVisible = false;
        this.standSignText.hidingDistance = 20;
        this.standSignText.isPickable = false;
        this.standSignText.applyFog = false;
        this.standSignText.parent = this;
        if (this.text) {
            if (MODE != "screenshot" && MODE != "cinematic" && !DEST) {
                this.standSignText.isVisible = true;
            }
            //console.log( BABYLON, BABYLON.GUI, BABYLON.BABYLON.GUI.Button );
            this.standMessage = BABYLON.GUI.Button.CreateSimpleButton(
                "standMessage",
                "",
            );
            this.standMessage.thickness = 0;
            this.standMessage.textBlock.text = this.text;
            this.standMessage.fontFamily = this.scene.fontName;
            if (this.standMessage.textBlock.text.length > 1)
                this.standMessage.fontSize = 55;
            else this.standMessage.fontSize = 150; // adapt text size
            this.standMessage.height = "256px";
            this.standMessage.width = "256px";
            this.standMessage.textWrapping = true;
            this.standMessage.color = "black";
            this.standTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
                this.standSignText,
                256,
                256,
            );
            this.standTexture.alpha = 0.7;

            this.standTexture.addControl(this.standMessage);
            // activate immersion sounds when first clicked on a stand
            let standMessage = this.standMessage;
            standMessage.scene = scene;
            standMessage.onPointerUpObservable.add(function () {
                standMessage.scene.unmuteAll();
            });
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // stand function to perform automated tasks when landing
    unlock() {}

    /**
     * Executes actions when a user arrives at this stand.
     * Handles visibility changes for UI elements and activates interactive features.
     *
     * @memberof Stand
     */
    doWhenArriving() {
        if (this.standSign && MODE !== "screenshot" && MODE !== "cinematic" && !DEST) {
            this.standSign.isVisible = false;
            // this.standSign._children[0].isVisible = false; // ball sign version
            // this.standSign._children[1].isVisible = false; // ball sign version
            // this.standSign._children[2].isVisible = false; // ball sign version
            this.standSignText.isVisible = false;
            this.standSign.clicked = true;
            this.standSign.material = this.scene.selectionMaterial;
            if (this.description) { this.standWindow.setEnabled(true); this.standWindow.isVisible = true; }
            if (this.description) { this.standWindowBack.setEnabled(true); this.standWindowBack.isVisible = true; }
            if (this.description) this.standWindowBack.isPickable = true;
            if (this.soundLinkBack) this.soundLinkBack.isVisible = true;
            if (this.soundLink) { this.soundLink.setEnabled(true); this.soundLink.isVisible = true; }
            if (this.soundButton) this.soundButton.isVisible = true;
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    /**
     * Executes actions when a user leaves this stand.
     * Restores visibility states and deactivates interactive features.
     *
     * @memberof Stand
     */
    doWhenLeaving() {
        if (this.standSign && MODE !== "screenshot" && MODE !== "cinematic" && !DEST) {
            this.standSign.isVisible = true;
            // this.standSign._children[0].isVisible = true; // ball sign version
            // this.standSign._children[1].isVisible = true; // ball sign version
            // this.standSign._children[2].isVisible = true; // ball sign version
            if (this.text) this.standSignText.isVisible = true;
            if (this.description) { this.standWindow.isVisible = false; this.standWindow.setEnabled(false); }
            if (this.description) { this.standWindowBack.isVisible = false; this.standWindowBack.setEnabled(false); }
            if (this.description) this.standWindowBack.isPickable = false;
            if (this.soundLinkBack) this.soundLinkBack.isVisible = false;
            if (this.soundLink) { this.soundLink.isVisible = false; this.soundLink.setEnabled(false); }
            if (this.soundButton) this.soundButton.isVisible = false;
        }
    }

    /**
     * Moves the camera to this stand's position and viewing angle.
     * Supports both animated and instant transitions.
     *
     * @param {boolean} withAnimation - Whether to animate the camera transition
     * @memberof Stand
     */
    startRotatingCamera() {
        const scene = this.scene;
        const FRAMES_PER_SECOND = 30;
        const TO_FRAME = 1000;
        let cameraRot = new BABYLON.Animation(
            "cameraRot",
            "alpha",
            FRAMES_PER_SECOND,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
        );
        let r = scene.activeCamera.alpha;
        cameraRot.setKeys([
            { frame: 0, value: r },
            { frame: TO_FRAME, value: r + 2 * Math.PI },
        ]);
        scene.activeCamera.animations = [];
        scene.activeCamera.animations.push(cameraRot);
        scene.activeCamera.anim = scene.beginAnimation(scene.activeCamera, 0, TO_FRAME, true);
        scene.cameraRotating = true;
    }

    attachCamera(withAnimation, frameOverride = null) {
        if (
            withAnimation == true &&
            this.animationActivated !== null &&
            this.animationActivated == false
        )
            withAnimation = false;
        if (
            DEST &&
            this.scene.cameraRotating == null &&
            this.scene.inXR == false
        ) {
            this.scene.activeCamera.position.x = this.position.x;
            this.scene.activeCamera.position.y = this.scene.viewHeight;
            this.scene.activeCamera.position.z = this.position.z;
            if (this.scene.inXR == false)
                this.scene.activeCamera.setTarget(this.lookingAt.clone());
            if (this.scene.inXR == false && MODE !== "dvp")
                this.scene.activeCamera.rebuildAnglesAndRadius();
            if (MODE !== "dvp")
                this.startRotatingCamera();
        } else if (
            withAnimation &&
            this.scene.inXR == false &&
            MODE !== "dvp"
        ) {
            this.scene.immersionUI.nextButton.isEnabled = false;
            this.scene.immersionUI.previousButton.isEnabled = false;
            const FRAMES_PER_SECOND = 30;
            const TO_FRAME = frameOverride !== null ? frameOverride : this.scene.standAnimationFrames;
            this.scene.cameraMoving = true;
            this.scene.activeCamera._p = new BABYLON.Vector3(0, 0, 0);
            let cameraAnimx = new BABYLON.Animation(
                "cameraAnimx",
                "_p.x",
                FRAMES_PER_SECOND,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            );
            let cameraAnimy = new BABYLON.Animation(
                "cameraAnimy",
                "_p.y",
                FRAMES_PER_SECOND,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            );
            let cameraAnimz = new BABYLON.Animation(
                "cameraAnimz",
                "_p.z",
                FRAMES_PER_SECOND,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            );
            let cameraAnimtx = new BABYLON.Animation(
                "cameraAnimtx",
                "target.x",
                FRAMES_PER_SECOND,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            );
            let cameraAnimty = new BABYLON.Animation(
                "cameraAnimty",
                "target.y",
                FRAMES_PER_SECOND,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            );
            let cameraAnimtz = new BABYLON.Animation(
                "cameraAnimtz",
                "target.z",
                FRAMES_PER_SECOND,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            );
            const keysx = [];
            keysx.push({ frame: 0, value: this.scene.activeCamera.position.x });
            keysx.push({ frame: TO_FRAME, value: this.position.x });
            cameraAnimx.setKeys(keysx);
            const keysy = [];
            keysy.push({ frame: 0, value: this.scene.activeCamera.position.y });
            keysy.push({ frame: TO_FRAME, value: this.scene.viewHeight });
            cameraAnimy.setKeys(keysy);
            const keysz = [];
            keysz.push({ frame: 0, value: this.scene.activeCamera.position.z });
            keysz.push({ frame: TO_FRAME, value: this.position.z });
            cameraAnimz.setKeys(keysz);
            const keystx = [];
            keystx.push({ frame: 0, value: this.scene.activeCamera.target.x });
            keystx.push({ frame: TO_FRAME, value: this.lookingAt.x });
            cameraAnimtx.setKeys(keystx);
            const keysty = [];
            keysty.push({ frame: 0, value: this.scene.activeCamera.target.y });
            keysty.push({ frame: TO_FRAME, value: this.lookingAt.y });
            cameraAnimty.setKeys(keysty);
            const keystz = [];
            keystz.push({ frame: 0, value: this.scene.activeCamera.target.z });
            keystz.push({ frame: TO_FRAME, value: this.lookingAt.z });
            cameraAnimtz.setKeys(keystz);
            this.scene.activeCamera.animations = [];
            this.scene.activeCamera.animations.push(cameraAnimx);
            this.scene.activeCamera.animations.push(cameraAnimy);
            this.scene.activeCamera.animations.push(cameraAnimz);
            this.scene.activeCamera.animations.push(cameraAnimtx);
            this.scene.activeCamera.animations.push(cameraAnimty);
            this.scene.activeCamera.animations.push(cameraAnimtz);

            this.scene.activeCamera.anim = this.scene.beginAnimation(
                this.scene.activeCamera,
                0,
                TO_FRAME,
                false,
            );

            let scene = this.scene;
            let lookingAt = this.lookingAt.clone();
            let position = this.position;
            this.scene.activeCamera.anim.onAnimationEnd = function () {
                if (scene.noMoreStands() == false)
                    scene.immersionUI.nextButton.isEnabled = true;
                if (scene.currentStandIndex > 0)
                    scene.immersionUI.previousButton.isEnabled = true;
                scene.activeCamera.setTarget(lookingAt);
                scene.activeCamera.position.x = position.x;
                scene.activeCamera.position.y = scene.viewHeight;
                scene.activeCamera.position.z = position.z;
                scene.activeCamera.rebuildAnglesAndRadius();
                scene.cameraMoving = false;
            };
        } else {
            this.scene.activeCamera.position.x = this.position.x;
            if (this.scene.inXR == false)
                this.scene.activeCamera.position.y = this.scene.viewHeight;
            this.scene.activeCamera.position.z = this.position.z;
            if (this.scene.inXR == false)
                this.scene.activeCamera.setTarget(this.lookingAt.clone());
            if (this.scene.inXR == false && MODE !== "dvp")
                this.scene.activeCamera.rebuildAnglesAndRadius();
        }
    }
} 
