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
 * Interactive teleporter stands for navigation between viewpoints or immersions.
 * Allows users to instantly travel to different locations or switch immersions.
 *
 * @class Teleporter
 * @extends Stand
 * @since 0.1.0
 */
class Teleporter extends Stand {
    /**
     * Creates a new Teleporter instance.
     *
     * @param {string} name - The name identifier for this teleporter
     * @param {Object} options - Configuration options extending Stand options
     * @param {string} [options.gate] - Target destination for teleportation
     * @param {BABYLON.Scene} scene - The BabylonJS scene instance
     * @memberof Teleporter
     */
    constructor(name, options, scene) {
        if (options.text == null) options.text = scene.texts.teleporter;
        super(name, options, scene);
        if (options.gate) this.gate = options.gate;
        if (this.gate && !this.gate.includes("/")) {
            // adds loading text if it is the immersion gate
            if (this.name == "GATE_STAND") {
                this.standSign.isPickable = false;
                var standMessage = this.standMessage;
                var standSign = this.standSign;
                this.standSign.standMessage = standMessage;
                standMessage.textBlock.text = scene.loadingShort;
                standSign.calledOnEveryFrame = (scene) => {
                    // displays loading status
                    standSign.standMessage.textBlock.text = scene.loadingShort;
                };
            } else this.activateGate();
        }
    }

    /**
     * Stops the loading indicator and activates the gate.
     * Used primarily for the GATE_STAND when scene loading is complete.
     *
     * @memberof Teleporter
     */
    stopLoading() {
        var scene = this.scene;
        this.standMessage.textBlock.text = scene.texts.start;
        this.standSign.isPickable = true;
        this.activateGate();
    }

    /**
     * Activates the teleportation functionality for this gate.
     * Sets up the gate name and prepares for user interaction.
     *
     * @memberof Teleporter
     */
    activateGate() {
        var scene = this.scene;
        var standSign = this.standSign;
        standSign.gateName = this.gate;
        standSign.calledOnEveryFrame = (scene) => {};
    }

    /**
     * Extends the base attachCamera function to handle teleportation.
     * Manages camera movement and triggers gate navigation on animation completion.
     *
     * @param {boolean} withAnimation - Whether to animate the camera transition
     * @memberof Teleporter
     */
    attachCamera(withAnimation) {
        super.attachCamera(withAnimation);
        if (
            withAnimation == true &&
            this.animationActivated !== null &&
            this.animationActivated == false
        )
            withAnimation = false;
        if (withAnimation && this.scene.inXR == false && MODE !== "dvp") {
            var scene = this.scene;
            var lookingAt = this.lookingAt.clone();
            var position = this.position;
            var gateName = this.gate;
            this.scene.activeCamera.anim.onAnimationEnd = function () {
                scene.activeCamera.setTarget(lookingAt);
                scene.activeCamera.position.x = position.x;
                if (scene.inXR == false)
                    scene.activeCamera.position.y = scene.viewHeight;
                scene.activeCamera.position.z = position.z;
                scene.activeCamera.rebuildAnglesAndRadius();
                scene.cameraMoving = false;
                if (gateName) {
                    if (gateName == "_NEXT") gateName = scene.nextStand().name;
                    scene.setCurrentStand(gateName);
                }
            };
        } else {
            if (this.gate) {
                if (this.gate == "_NEXT")
                    this.gate = this.scene.nextStand().name;
                this.scene.setCurrentStand(this.gate);
            }
        }
    }
} 
