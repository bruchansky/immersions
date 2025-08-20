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
 * Interactive display stands that can show images, text, and play audio.
 * Extends Stand with multimedia capabilities and windowed content display.
 *
 * @class Display
 * @extends Stand
 * @since 0.1.0
 */
// Display class definition
class Display extends Stand {
    /**
     * Creates a new Display instance.
     *
     * @param {string} name - The name identifier for this display
     * @param {Object} options - Configuration options extending Stand options
     * @param {string} [options.title] - Title shown in the display window
     * @param {string} [options.description] - Description text in the display window
     * @param {string} [options.sound] - URL of audio file to play
     * @param {boolean} [options.loop=false] - Whether audio should loop
     * @param {number} [options.factorSound=0.8] - Audio volume factor
     * @param {number} [options.height=1.25] - Height of the display
     * @param {number} [options.width=0.3] - Width of the display
     * @param {number} [options.depth=0.1] - Depth of the display
     * @param {number} [options.distance=1] - Distance from stand base
     * @param {boolean} [options.windowOpened] - Whether display window opens by default
     * @param {BABYLON.Scene} scene - The BabylonJS scene instance
     * @memberof Display
     */
    constructor(name, options, scene) {
        if (options.text == null) options.text = scene.texts.display;
        super(name, options, scene);
        if (options.title) this.title = options.title; // appears in the stand window
        if (options.description) this.description = options.description; // appears in the stand window
        if (options.windowOpened && MODE !== "screenshot" && !DEST)
            this.windowOpened = options.windowOpened;
        if (options.sound !== null && options.sound) this.sound = options.sound; // only if sound
        if (options.loop !== null && options.loop) this.loop = options.loop;
        else this.loop = false; // only if sound
        if (options.factorSound !== null && options.factorSound)
            this.factorSound = options.factorSound;
        else this.factorSound = 0.8; // only if sound
        if (options.height !== null && options.height)
            this.height = options.height;
        else this.height = 1.25; // default display height
        if (options.distance !== null && options.distance)
            this.distance = options.distance;
        else this.distance = 1; // distance from the base
        if (options.width !== null && options.width) this.width = options.width;
        else if (this.width == null) this.width = 0.3;
        if (options.depth !== null && options.depth) this.depth = options.depth;
        else this.depth = 0.1;
        // creates the plinth (main physical part of the display)
        if (this.style == "dark"){
            this.styleMaterial = scene.darkPlinthMaterial;
        } else if (this.style == "light"){
            this.styleMaterial = scene.lightPlinthMaterial;
        } else  if (this.style == "lightwireframe"){
            this.styleMaterial = scene.lightWireframePlinthMaterial;
        } else  if (this.style == "darkwireframe"){
            this.styleMaterial = scene.darkWireframePlinthMaterial;
        }
        this.plinth = BABYLON.MeshBuilder.CreateBox("plinth", {
            height: this.height,
            width: this.width,
            depth: this.depth,
        });
        this.plinth.hidingDistance = 500;
        this.plinth.parent = this;
        this.plinth.position = new BABYLON.Vector3(
            0,
            this.height / 2 - 0.05,
            this.distance,
        );
        this.plinth.isPickable = false;
        this.plinth.material = this.styleMaterial;
        // creates the base of the display
        const myShape = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 0, 0.4),
            new BABYLON.Vector3(-0.4, 0, 0.4),
            new BABYLON.Vector3(-0.06, 0, 0),
        ];
        this.plinthBase = BABYLON.MeshBuilder.ExtrudePolygon(
            "plinthBase",
            { shape: myShape, depth: this.width },
            scene,
        );
        this.plinthBase.parent = this.plinth;
        this.plinthBase.isPickable = false; // only shows for
        this.plinthBase.rotation.z = BABYLON.Tools.ToRadians(-90);
        this.plinthBase.position = new BABYLON.Vector3(
            this.width / 2,
            -this.height / 2,
            -0.35,
        );
        this.plinthBase.material = this.styleMaterial;
        //this.plinthBase.isVisible=false;
        // adds button to start sound file if any (see demo file)
        if (this.sound) {
            this.plinth.isVisible = true;
            this.plinthBase.isVisible = true;
            this.soundLinkBack = BABYLON.MeshBuilder.CreateBox("soundBack", {
                height: 0.06,
                width: 0.18,
                depth: 0.02,
            });
            this.soundLinkBack.parent = this.plinth;
            this.soundLinkBack.material = this.styleMaterial;
            this.soundLinkBack.position = new BABYLON.Vector3(
                0,
                this.height / 2 - 0.05,
                -this.depth / 2 - 0.001,
            );
            this.soundLink = BABYLON.MeshBuilder.CreatePlane("soundButton", {
                height: 0.06,
                width: 0.18,
                sidelookingAt: BABYLON.Mesh.DOUBLESIDE,
            });
            this.soundLink.parent = this.plinth;
            this.soundLink.position = new BABYLON.Vector3(
                0,
                this.height / 2 - 0.05,
                -this.depth / 2 - 0.012,
            );
            this.soundLinkTexture =
                BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
                    this.soundLink,
                    360,
                    120,
                );
            this.soundLinkTexture.background = "black";
            this.soundButton = BABYLON.GUI.Button.CreateSimpleButton(
                "standWindowButton",
                "",
            );
            this.soundButton.fontSize = 35;
            this.soundButton.height = "120px";
            this.soundButton.width = "360px";
            this.soundButton.fontFamily = this.fontName;
            this.soundButton.cornerRadius = 0;
            this.soundButton.color = "white";
            this.soundButton.thickness = 5;
            this.soundButton.background = "black";
            this.soundButton.textBlock.text = scene.texts.play;
            this.soundButton.verticalAlignment =
                BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            this.soundLinkTexture.addControl(this.soundButton);
            var soundLink = this.soundLink;
            var actionManager = scene.highlight(soundLink);
            this.soundButton.onPointerUpObservable.add(function () {
                scene.currentStand().pressSoundButton();
                scene.currentStand().soundButton.edgesWidth = 0;
            });
            this.soundLinkBack.isVisible = false;
            this.soundLink.isVisible = false;
            this.soundButton.isVisible = false;
        }
        // adds window if any text
        if (this.description) {
            let positionFront = 0.03;
            if (this.depth >= 0.3) positionFront = this.depth / 2 + 0.005;
            this.standWindowBack = BABYLON.MeshBuilder.CreateBox(
                "standWindowBack",
                { height: 0.3, width: this.width, depth: 0.05 },
            );
            this.standWindowBack.parent = this.plinth;
            this.standWindowBack.material = this.scene.interfaceMaterial;
            /* main window */
            var standWindow = BABYLON.MeshBuilder.CreatePlane("standWindow", {
                height: 0.3,
                width: this.width,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE,
            });
            this.standWindow = standWindow;
            this.standWindow.isPickable = true;
            this.standWindow.parent = this.plinth;
            this.standWindow.position = new BABYLON.Vector3(
                0,
                this.height / 2 + 0.3,
                -positionFront,
            );
            this.standWindow.applyFog = false;
            this.standWindowTitle = new BABYLON.GUI.TextBlock();
            this.standWindowTitle.text = this.title;
            this.standWindowTitle.fontFamily = this.scene.fontName;
            this.standWindowTitle.color = "white";
            this.standWindowTitle.height = "60px";
            this.standWindowTitle.width = (300 / 0.3) * this.width - 40 + "px";
            this.standWindowTitle.lineSpacing = "5px";
            this.standWindowTitle.verticalAlignment =
                BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            this.standWindowTitle.fontSize = 23;
            this.standWindowMessage = new BABYLON.GUI.TextBlock();
            this.standWindowMessage.fontFamily = this.scene.fontName;
            this.standWindowMessage.text = "\n" + this.description;
            this.standWindowMessage.textWrapping = true;
            this.standWindowMessage.textVerticalAlignment = "center";
            this.standWindowMessage.color = "white";
            this.standWindowMessage.height = "230px";
            this.standWindowMessage.width =
                (300 / 0.3) * this.width - 40 + "px";
            this.standWindowMessage.lineSpacing = "8px";
            this.standWindowMessage.verticalAlignment =
                BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.standWindowMessage.fontSize = 16;
            this.standWindowCloseMessage = new BABYLON.GUI.TextBlock();
            this.standWindowCloseMessage.fontFamily = this.scene.fontName;
            this.standWindowCloseMessage.text = this.scene.texts.closeWindow;
            this.standWindowCloseMessage.textWrapping = true;
            this.standWindowCloseMessage.color = "white";
            this.standWindowCloseMessage.height = "40px";
            this.standWindowCloseMessage.width =
                (300 / 0.3) * this.width - 40 + "px";
            this.standWindowCloseMessage.lineSpacing = "10px";
            this.standWindowCloseMessage.verticalAlignment =
                BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.standWindowCloseMessage.fontSize = 14;
            this.standWindowTexture =
                BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
                    this.standWindow,
                    (300 / 0.3) * this.width,
                    300,
                );
            this.standWindowTexture.addControl(this.standWindowTitle);
            this.standWindowTexture.addControl(this.standWindowMessage);
            this.standWindowTexture.addControl(this.standWindowCloseMessage);
            this.standWindow.isVisible = false;
            this.standWindowBack.isVisible = false;
            this.standWindowBack.isPickable = false;

            if (this.windowOpened) {
                this.standWindowBack.position = new BABYLON.Vector3(
                    0,
                    this.height / 2 + 0.3,
                    0,
                );
                this.standWindow.scaling.y = 1;
                this.standWindowTexture =
                    BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
                        this.standWindow,
                        (300 / 0.3) * this.width,
                        300,
                    );
                this.standWindowTexture.addControl(this.standWindowTitle);
                this.standWindowTexture.addControl(this.standWindowMessage);
                this.standWindowTexture.addControl(
                    this.standWindowCloseMessage,
                );
                this.standWindowTitle.text = this.title;
                this.standWindow.position = new BABYLON.Vector3(
                    0,
                    this.height / 2 + 0.3,
                    -positionFront,
                );
            } else {
                this.standWindowBack.position = new BABYLON.Vector3(
                    0,
                    this.height / 2 + 0.05,
                    0,
                );
                this.standWindowBack.scaling.y = 0.2;
                this.standWindow.scaling.y = 0.2;
                this.standWindowTexturemin =
                    BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
                        this.standWindow,
                        (300 / 0.3) * this.width,
                        60,
                    );
                this.standWindowTexturemin.addControl(this.standWindowTitle);
                this.standWindowTitle.text = "⇧ " + this.title + " ⇧";
                this.standWindow.position = new BABYLON.Vector3(
                    0,
                    this.height / 2 + 0.05,
                    -positionFront,
                );
            }

            var standWindow = this.standWindow;

            standWindow.stand = this;
            var actionManager = scene.highlight(standWindow);
            actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    function (ev) {
                        standWindow.stand.scene.unmuteAll();
                        standWindow.stand.windowSwitch();
                        standWindow.edgesWidth = 0;
                    },
                ),
            );
        }
    }

    /**
     * Toggles the display window between expanded and minimized states.
     * Handles animations and UI state changes for the window display.
     *
     * @memberof Display
     */
    windowSwitch() {
        let positionFront = 0.03;
        if (this.depth >= 0.3) positionFront = this.depth / 2 + 0.005;
        var animationBox1 = new BABYLON.Animation(
            "boxAnimation",
            "scaling.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        );
        var animationBox2 = new BABYLON.Animation(
            "boxAnimation2",
            "position.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        );
        if (this.standWindowBack.scaling.y == 1) {
            this.standWindow.scaling.y = 0.2;
            this.standWindowTexturemin =
                BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
                    this.standWindow,
                    (300 / 0.3) * this.width,
                    60,
                );
            this.standWindowTexturemin.addControl(this.standWindowTitle);
            this.standWindowTitle.text = "⇧ " + this.title + " ⇧";
            this.standWindow.position = new BABYLON.Vector3(
                0,
                this.height / 2 + 0.05,
                -positionFront,
            );
            if (this.animationActivated == false) {
                this.standWindowBack.position = new BABYLON.Vector3(
                    0,
                    this.height / 2 + 0.05,
                    0,
                );
                this.standWindowBack.scaling.y = 0.2;
                this.standWindowTitle.text = "⇧ " + this.title + " ⇧";
            } else {
                var keys = [];
                keys.push({ frame: 0, value: 1 });
                keys.push({ frame: 10, value: 0.2 });
                var keys2 = [];
                keys2.push({ frame: 0, value: this.height / 2 + 0.3 });
                keys2.push({ frame: 10, value: this.height / 2 + 0.05 });
                animationBox1.setKeys(keys);
                animationBox2.setKeys(keys2);
                this.standWindowBack.animations = [];
                this.standWindowBack.animations.push(animationBox1);
                this.standWindowBack.animations.push(animationBox2);
                this.standWindow.isVisible = false;
                var standWindow = this.standWindow;
                var event = new BABYLON.AnimationEvent(
                    10,
                    function () {
                        standWindow.isVisible = true;
                    },
                    true,
                );
                animationBox1.addEvent(event);
                this.standWindowBack.anim = this.scene.beginAnimation(
                    this.standWindowBack,
                    0,
                    10,
                    false,
                );
            }
        } else if (this.standWindowBack.scaling.y == 0.2) {
            this.standWindow.scaling.y = 1;
            this.standWindowTexture =
                BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
                    this.standWindow,
                    (300 / 0.3) * this.width,
                    300,
                );
            this.standWindowTexture.addControl(this.standWindowTitle);
            this.standWindowTexture.addControl(this.standWindowMessage);
            this.standWindowTexture.addControl(this.standWindowCloseMessage);
            this.standWindowTitle.text = this.title;
            this.standWindow.position = new BABYLON.Vector3(
                0,
                this.height / 2 + 0.3,
                -positionFront,
            );
            if (this.animationActivated == false) {
                this.standWindowBack.position = new BABYLON.Vector3(
                    0,
                    this.height / 2 + 0.3,
                    0,
                );
                this.standWindowBack.scaling.y = 1;
                this.standWindowTitle.text = this.title;
            } else {
                var keys = [];
                keys.push({ frame: 0, value: 0.2 });
                keys.push({ frame: 10, value: 1 });
                var keys2 = [];
                keys2.push({ frame: 0, value: this.height / 2 + 0.05 });
                keys2.push({ frame: 10, value: this.height / 2 + 0.3 });
                animationBox1.setKeys(keys);
                animationBox2.setKeys(keys2);
                this.standWindowBack.animations = [];
                this.standWindowBack.animations.push(animationBox1);
                this.standWindowBack.animations.push(animationBox2);
                this.standWindow.isVisible = false;
                var standWindow = this.standWindow;
                var event = new BABYLON.AnimationEvent(
                    10,
                    function () {
                        standWindow.isVisible = true;
                    },
                    true,
                );
                animationBox1.addEvent(event);
                this.standWindowBack.anim = this.scene.beginAnimation(
                    this.standWindowBack,
                    0,
                    10,
                    false,
                );
            }
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // display functions to manage audio attached to the display
    /**
     * Attaches sound data to this display for audio playback.
     *
     * @param {ArrayBuffer} sound_data - The audio file data to attach
     * @memberof Display
     */
    loadSound(sound_data) {
        this.sound_data = sound_data;
    }
    /**
     * Handles user interaction with the sound button.
     * Toggles between play and stop states for audio playback.
     *
     * @memberof Display
     */
    pressSoundButton() {
        this.scene.playClick();
        if (this.sound_data) {
            if (this.soundButton.textBlock.text == this.scene.texts.play)
                this.playSound(true);
            else this.stopSound();
        }
    }
    /**
     * Plays the audio associated with this display.
     * Stops audio from other displays and manages spatial audio positioning.
     *
     * @memberof Display
     */
    playSound(force) {
        if (MUTE == false || force) {
            for (const stand of this.scene.stands) {
                if (stand.sound_data) stand.stopSound();
            }
            this.soundButton.textBlock.text = this.scene.texts.pause;
            if (this.soundTrack == null) {
                // if first time playing
                this.soundTrack = new BABYLON.Sound(
                    this.sound,
                    this.sound_data,
                    this.scene,
                    null,
                    {
                        loop: this.loop,
                        autoplay: true,
                        spatialSound: true,
                        rolloffFactor: this.factorSound,
                        maxDistance: 15,
                    },
                );
                this.sound = "onpress"; // doesn't play again the track automatically
                const matrix = this.plinth.computeWorldMatrix(true);
                const soundPosition = BABYLON.Vector3.TransformCoordinates(
                    new BABYLON.Vector3(
                        this.plinth.position.x,
                        1.5,
                        this.plinth.position.z,
                    ),
                    matrix,
                );
                this.soundTrack.setPosition(soundPosition);
                this.scene.unmuteAll(true);
                this.soundTrack.scene = this.scene;
                this.soundTrack.onended = function () {
                    for (const stand of this.scene.stands) {
                        if (stand.sound_data) stand.stopSound();
                    }
                };
            } else {
                this.soundTrack.play(0);
                this.scene.unmuteAll(true);
            }
        }
    }
    /**
     * Stops the audio playback for this display.
     * Updates the sound button state accordingly.
     *
     * @memberof Display
     */
    stopSound() {
        if (this.sound) {
            if (this.soundButton.textBlock.text == this.scene.texts.pause) {
                // if not the current stand and already playing
                this.soundTrack.stop();
                this.soundButton.textBlock.text = this.scene.texts.play;
            }
        }
    }
    doWhenArriving() {
        // plays a sound automatically when arriving at a display
        super.doWhenArriving();
        if (this.sound == "autoplay") {
            let shouldIPlay = true;
            for (const stand of this.scene.stands) {
                if (
                    stand.sound_data && stand.soundButton &&
                    stand.soundButton.textBlock.text == this.scene.texts.pause
                )
                    shouldIPlay = false;
            }
            if (shouldIPlay == true) this.playSound();
        }
    }
} 
