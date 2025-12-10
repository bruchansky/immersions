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
 * Main class for creating point and click 3D/VR immersions with BabylonJS.
 * Extends BABYLON.Scene with enhanced features for navigation, UI, XR support, and audio.
 *
 * @class Immersion
 * @extends BABYLON.Scene
 */
class Immersion extends BABYLON.Scene {
  /**
   * Creates a new Immersion instance.
   *
   * @param {string} name - The name identifier for this immersion
   * @param {string} style - The UI style theme ("light" or "dark")
   * @param {BABYLON.Engine} engine - The BabylonJS engine instance
   * @memberof Immersion
   */
  constructor(name, style, engine, config = {}) {
    super(engine);
    this.name = name;
    this.inXR = false; // tells if the immersion has entered the VR mode
    this.userPosition = "standing";
    this.style = style; // "light" or "dark" style of the immersion, used to adapt navigation colours
    this.loadingCounter = 200; // number used to initiate loading loop
    this.locks = 0;
    this.unlocks = 0;

    // Configurable properties with defaults
    const defaults = {
      viewHeight: 1.75,
      skyboxSize: 2000,
      skyColor: new BABYLON.Color3(0.941, 0.772, 0.239),
      fogDensity: 0.05,
      fogColor: new BABYLON.Color3(1, 1, 1),
      groundSize: 2002,
      groundShadows: false,
      standAnimationFrames: 50,
    };

    Object.assign(this, defaults, config);

    var groundMaterial = new BABYLON.StandardMaterial("ground", this); // custom ground material
    groundMaterial.alpha = 1;
    groundMaterial.diffuseColor = new BABYLON.Color3(0.941, 0.772, 0.239);
    this.viewHeight = this.viewHeight; // default size of the user
    var defaultOptionsScene = {
      createGround: false,
      skyboxSize: this.skyboxSize,
      sizeAuto: false,
      groundSize: this.groundSize,
      groundYBias: 0.01,
      groundMaterial: groundMaterial,
    };
    this.fogMode = BABYLON.Scene.FOGMODE_EXP;
    this.fontName = "Tahoma, Georgia"; //Tahoma, Georgia
    this.env = this.createDefaultEnvironment(defaultOptionsScene);
    this.env.skyboxMaterial.primaryColor = this.skyColor;
    this.clearColor = this.skyColor;
    this.ambientColor = this.skyColor;
    this.ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: this.groundSize, height: this.groundSize },
      this
    );
    this.ground.checkCollisions = true;
    this.ground.isPickable = false;
    this.ground.material = groundMaterial; // applies the custom ground material
    this.ground.receiveShadows = this.groundShadows;
    this.XRTeleportMaterial = new BABYLON.StandardMaterial("pointer");
    this.XRTeleportMaterial.backFaceCulling = false;
    this.XRTeleportMaterial.diffuseColor = BABYLON.Color3.White();
    this.XRTeleportMaterial.emissiveColor = BABYLON.Color3.White();
    this.addDefaultText(); // sets all default text

    // Set up audio file references
    const assetBasePath = "/immersion_engine/assets/";
    this.soundsp = {
      missionComplete: assetBasePath + "mission-complete.mp3",
      newItem: assetBasePath + "new-item.mp3",
      twoLeft: assetBasePath + "two-left.mp3",
      oneLeft: assetBasePath + "one-left.mp3",
      click: assetBasePath + "click.mp3",
    };

    this.sceneSounds = new Array();
    /* camera settings */
    if (typeof MODE !== "undefined" && MODE == "dvp")
      this.camera = new BABYLON.UniversalCamera(
        "camera",
        new BABYLON.Vector3(0, 0, 0),
        this
      );
    else
      this.camera = new BABYLON.ArcRotateCamera(
        "camera",
        0,
        0,
        0,
        new BABYLON.Vector3(0, 0, 0),
        this
      );
    this.camera.allowUpsideDown = false;
    this.camera.lowerRadiusLimit = 0.1;

    // Camera control will be attached after engine creation
    this.camera.minZ = 0.05;
    this.camera.angularSensibilityX = 4000;
    this.camera.angularSensibilityY = 4000;
    this.camera.wheelPrecision = 10;
    this.camera.pinchPrecision = 200;
    this.camera.speed = 0.1;
    this.camera.ellipsoid = new BABYLON.Vector3(0.05, this.viewHeight / 2, 0.5);
    this.gravity = new BABYLON.Vector3(0, -0.9, 0);
    this.collisionsEnabled = true;
    this.camera.checkCollisions = true;
    this.camera.applyGravity = true;
    this.cameraMoving == false; // used to detect if a camera transition is ongoing

    // sets boundaries to the scene
    var limit0 = BABYLON.MeshBuilder.CreatePlane("limit0", {
      height: this.groundSize,
      width: this.groundSize,
    });
    limit0.rotation.x = BABYLON.Tools.ToRadians(-90);
    limit0.position = new BABYLON.Vector3(0, 1001, 0);
    limit0.isVisible = false;
    var limit1 = BABYLON.MeshBuilder.CreatePlane("limit1", {
      height: this.groundSize,
      width: this.groundSize,
    });
    limit1.position = new BABYLON.Vector3(0, 1001, 1001);
    limit1.isVisible = false;
    var limit2 = BABYLON.MeshBuilder.CreatePlane("limit2", {
      height: this.groundSize,
      width: this.groundSize,
    });
    limit2.rotation.y = BABYLON.Tools.ToRadians(-90);
    limit2.position = new BABYLON.Vector3(-1001, 1001, 0);
    limit2.isVisible = false;
    var limit3 = BABYLON.MeshBuilder.CreatePlane("limit3", {
      height: this.groundSize,
      width: this.groundSize,
    });
    limit3.rotation.y = BABYLON.Tools.ToRadians(180);
    limit3.position = new BABYLON.Vector3(0, 1001, -1001);
    limit3.isVisible = false;
    var limit4 = BABYLON.MeshBuilder.CreatePlane("limit4", {
      height: 502,
      width: 502,
    });
    limit4.rotation.y = BABYLON.Tools.ToRadians(90);
    limit4.position = new BABYLON.Vector3(1001, 1001, 0);
    limit4.isVisible = false;
    limit0.checkCollisions = true;
    limit1.checkCollisions = true;
    limit2.checkCollisions = true;
    limit3.checkCollisions = true;
    limit4.checkCollisions = true;

    this.stands = new Array();

    // set default material: dark plinth material
    this.darkPlinthMaterial = new BABYLON.StandardMaterial("darkPlinth", this);
    this.darkPlinthMaterial.ambientColor = BABYLON.Color3.Black();
    this.darkPlinthMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    this.darkPlinthMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    // set default material: light plinth material
    this.lightPlinthMaterial = new BABYLON.StandardMaterial(
      "lightPlinth",
      this
    );
    this.lightPlinthMaterial.diffuseColor = BABYLON.Color3.White();
    this.lightPlinthMaterial.ambientColor = BABYLON.Color3.White();
    // set default material: light wireframe plinth material
    this.lightWireframePlinthMaterial = new BABYLON.StandardMaterial(
      "lightWireframePlinth",
      this
    );
    this.lightWireframePlinthMaterial.wireframe = true;
    this.lightWireframePlinthMaterial.emissiveColor = new BABYLON.Color3(
      1,
      1,
      1
    );
    this.lightWireframePlinthMaterial.disableLighting = true;
    // set default material: dark wireframe plinth material
    this.darkWireframePlinthMaterial = new BABYLON.StandardMaterial(
      "darkWireframePlinth",
      this
    );
    this.darkWireframePlinthMaterial.wireframe = true;
    this.darkWireframePlinthMaterial.emissiveColor = new BABYLON.Color3(
      0,
      0,
      0
    );
    this.darkWireframePlinthMaterial.disableLighting = true;
    // set material for 3D text boxes
    this.interfaceMaterial = new BABYLON.StandardMaterial("interface", this);
    this.interfaceMaterial.emissiveColor = BABYLON.Color3.Black();
    this.interfaceMaterial.disableLighting = true;
    // set material for roll over interactions
    this.selectionMaterial = new BABYLON.StandardMaterial("selection", this);
    this.selectionMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0.4);
    this.selectionMaterial.specularColor = new BABYLON.Color3(1, 0, 1);
    this.selectionMaterial.emissiveColor = new BABYLON.Color3(1, 0.4, 1);
    this.selectionMaterial.alpha = 1;
    // set default stand pointer material
    this.standMaterial = new BABYLON.StandardMaterial("stand", this);
    this.standMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0.2);
    this.standMaterial.specularColor = new BABYLON.Color3(1, 0, 1);
    this.standMaterial.emissiveColor = new BABYLON.Color3(0, 0.5, 0);
    this.standMaterial.alpha = 1;
    // set material for lines joining stands
    this.lineMaterial = new BABYLON.StandardMaterial("line", this);
    if (this.style == "dark")
      this.lineMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    else this.lineMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0);
    this.lineMaterial.disableLighting = true;
    // set material for link stands
    this.clickLinkMaterial = new BABYLON.StandardMaterial("clickLink", this);
    this.clickLinkMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0.4);
    this.clickLinkMaterial.specularColor = new BABYLON.Color3(1, 0, 1);
    this.clickLinkMaterial.emissiveColor = new BABYLON.Color3(1, 0.4, 0);
    this.clickLinkMaterial.alpha = 1;

    // displays loading icon until the scene is fully loaded
    var scene = this;
    scene.loadingShort = "";
    scene.loading = "";
    this.assetsManager = new BABYLON.AssetsManager(this);
    this.assetsManager.useDefaultLoadingScreen = true;
    BABYLON.DefaultLoadingScreen.DefaultLogoUrl =
      "/immersion_engine/assets/immersions-loading.PNG";
    engine.loadingUIText = `<span style="font-size: 3em;">${scene.loading}</span>`;
    engine.loadingUIBackgroundColor = "#333333";

    engine.displayLoadingUI();

    scene.assetsManager.onProgress = function (
      remainingCount,
      totalCount,
      lastFinishedTask
    ) {
      var doneCount = totalCount - remainingCount;
      scene.loadingShort =
        scene.texts.loadingShort + "\n(" + doneCount + "/" + totalCount + ")";
      scene.loading =
        scene.texts.loadingText +
        scene.texts.title.toUpperCase() +
        "<br><br>" +
        scene.texts.author +
        " - " +
        scene.texts.year +
        "<br>" +
        scene.texts.loading +
        "(" +
        doneCount +
        "/" +
        totalCount +
        ")";
      const loadedCount = totalCount - remainingCount;
      const percentLoaded = Math.round((loadedCount / totalCount) * 100);
      engine.loadingUIText = scene.loading;
    };

    scene.assetsManager.onFinish = function (tasks) {
      engine.hideLoadingUI();
      if (scene.loadingCounter) {
        scene.loadingCounter == null;
      }
      for (const stand of scene.stands) {
        if (stand.name == "GATE_STAND") stand.stopLoading();
      }
      var result = new BABYLON.SceneOptimizerOptions(30, 2000);
      let priority = 0;
      //result.optimizations.push(new BABYLON.ShadowsOptimization(priority));
      result.optimizations.push(new BABYLON.LensFlaresOptimization(priority));
      priority++;
      result.optimizations.push(
        new BABYLON.PostProcessesOptimization(priority)
      );
      result.optimizations.push(new BABYLON.ParticlesOptimization(priority));
      priority++;
      result.optimizations.push(new BABYLON.TextureOptimization(priority, 256));
      priority++;
      result.optimizations.push(
        new BABYLON.RenderTargetsOptimization(priority)
      );
      priority++;
      result.optimizations.push(
        new BABYLON.HardwareScalingOptimization(priority, 4)
      );
      /*
      BABYLON.SceneOptimizer.OptimizeAsync(
        scene,
        result,
        function () {
          // On success
        },
        function () {
          // FPS target not reached
        }
      );
      */
    };

    var loading_click = this.assetsManager.addBinaryFileTask(
      "loading_click",
      "/immersion_engine/assets/click.mp3"
    );
    loading_click.onSuccess = function (task) {
      scene.clickData = task.data;
    };
  }

  setGroundMaterial(backgroundMaterial) {
    this.ground.material = backgroundMaterial;
  }

  /**
   * Loads text content from the JSON configuration file and applies it based on the current language.
   * Populates this.texts with localized strings for UI elements, labels, and messages.
   *
   * @memberof Immersion
   */
  addDefaultText() {
    // Initialize with default text values for all stand types
    this.texts = {
      // Default stand type texts
      stand: { text: "Stand", title: "Stand", description: "A basic stand" },
      display: {
        text: "Display",
        title: "Display",
        description: "A display stand",
      },
      plinth: {
        text: "Plinth",
        title: "Plinth",
        description: "A plinth display",
      },
      teleporter: {
        text: "Teleporter",
        title: "Teleporter",
        description: "A teleporter",
      },
      link: { text: "Link", title: "Link", description: "A web link" },

      // Default UI texts
      play: "Play",
      closeWindow: "Close",
      start: "Start",
      loading: "Loading...",
    };

    var data = window.immersionData;
    const textData =
      data.texts.find((t) => t.lang === LANG) ||
      data.texts.find((t) => t.lang === "en"); // fallback to English

    if (textData) {
      // Copy all properties from the JSON data to this.texts, merging with defaults
      Object.assign(this.texts, textData);
    } else {
      // Fallback error handling if no text data found
      console.warn("No text data found for language:", LANG);
    }
  }

  /**
   * Imports immersion data from JSON configuration including texts and stands.
   * Creates texts the same way as addDefaultText and creates stands from the configuration.
   *
   * @param {Object} jsonData - The JSON data containing texts and stands configuration
   * @memberof Immersion
   */
  importData(jsonData) {
    // Import texts if available
    if (jsonData.texts) {
      const textData =
        jsonData.texts.find((t) => t.lang === LANG) ||
        jsonData.texts.find((t) => t.lang === "en"); // fallback to English as default

      if (textData) {
        // Merge with existing texts
        this.texts = { ...this.texts, ...textData };
      }
    }

    // Import stands if available
    if (jsonData.stands && Array.isArray(jsonData.stands)) {
      for (const standData of jsonData.stands) {
        try {
          let stand;
          const options = {};

          // Convert all properties from standData, handling Vector3 conversion and text localization
          for (const [key, value] of Object.entries(standData)) {
            if (key === "position" || key === "lookingAt") {
              // Convert plain objects to BABYLON.Vector3
              if (
                value &&
                typeof value === "object" &&
                value.x !== undefined &&
                value.y !== undefined &&
                value.z !== undefined
              ) {
                options[key] = new BABYLON.Vector3(value.x, value.y, value.z);
              }
            } else if (key === "text" && Array.isArray(value)) {
              // Handle localized text data
              const textData =
                value.find((t) => t.lang === LANG) ||
                value.find((t) => t.lang === "en"); // fallback to English

              if (textData) {
                // Add all text properties except 'lang' to options
                for (const [textKey, textValue] of Object.entries(textData)) {
                  if (textKey !== "lang") {
                    options[textKey] = textValue;
                  }
                }
              }
            } else if (key !== "type" && key !== "id") {
              // Copy all other properties except type and id
              options[key] = value;
            }
          }

          // Create the appropriate stand type
          switch (standData.type) {
            case "Stand":
              stand = new Stand(standData.id, options, this);
              break;
            case "Display":
              stand = new Display(standData.id, options, this);
              break;
            case "Plinth":
              stand = new Plinth(standData.id, options, this);
              break;
            case "Teleporter":
              stand = new Teleporter(standData.id, options, this);
              break;
            case "Link":
              stand = new Link(standData.id, options, this);
              break;
            default:
              console.warn(`Unknown stand type: ${standData.type}`);
              continue;
          }

          if (stand) {
            this.addStand(stand);
            console.log(
              `Successfully created stand ${standData.id} of type ${standData.type}`
            );
          }
        } catch (error) {
          console.error(`Error creating stand ${standData.id}:`, error);
          console.error("Error details:", error.message, error.stack);
          console.error("Stand data:", standData);
        }
      }
    }

    this.immersionUI = new ImmersionUI(this);
    this.goFirstStand();
    this.currentStand().attachCamera(false);
    this.automatedActions();
    this.immersionUI.automatedActions();
    if (MODE == "screenshot" || DEST) {
      for (const s of this.stands) {
        s.standBase.isVisible = false;
        if (s.standSign) {
          s.standSign.isVisible = false;
          // s.standSign._children[0].isVisible = false; // ball sign version
          // s.standSign._children[1].isVisible = false;
          // s.standSign._children[2].isVisible = false;
        }
        if (s.standBox) s.standBox.isVisible = false;
        if (s.standLines) s.standLines.isVisible = false;
        if (s.plinth) s.plinth.isVisible = false;
        if (DEST && s.exhibitMesh && s.name == DEST) s.plinth.isVisible = true;
        if (s.plinthBase) s.plinthBase.isVisible = false;
        if (s.soundLinkBack) s.soundLinkBack.isVisible = false;
        if (s.soundButton) s.soundButton.isVisible = false;
        if (s.soundLink) s.soundLink.isVisible = false;
        if (s.soundBox) s.soundBox.isVisible = false;
        if (s.soundBall) s.soundBall.isVisible = false;
        if (s.standImage) s.standImage.isVisible = false;
        if (s.image) s.image.isVisible = false;
        if (s.standWindow) s.standWindow.isVisible = false;
        if (s.standWindowBack) s.standWindowBack.isVisible = false;
      }
    }
  }

  /**
   * Attaches a sound to a specified stand by its name.
   *
   * @param {string} nameStand - The name of the stand to attach the sound to.
   * @param {object} sound - The sound object to attach to the stand.
   * @memberof Immersion
   */
  attachSound(nameStand, sound) {
    const stand = this.findStandByName(nameStand);
    if (stand) {
      stand.loadSound(sound);
    } else {
      console.warn("Stand not found:", nameStand);
    }
  }

  /**
   * Attaches a mesh to a specified stand by its name.
   *
   * @param {string} nameStand - The name of the stand to attach the mesh to.
   * @param {BABYLON.Mesh} mesh - The mesh to attach to the stand.
   * @memberof Immersion
   */
  attachMesh(nameStand, mesh) {
    const stand = this.findStandByName(nameStand);
    if (stand) {
      stand.setExhibit(mesh);
    } else {
      console.warn("Stand not found:", nameStand);
    }
  }

  addStand(stand) {
    this.stands.push(stand);
  }

  goFirstStand() {
    if (DEST !== null && DEST) {
      this.currentStandIndex = 0;
      for (const s of this.stands) {
        if (s.name == DEST) this.currentStandIndex = this.stands.indexOf(s);
      }
    } else if (this.stands.length > 0) {
      this.currentStandIndex = 0;
    }
  }
  goNextStand() {
    if (this.currentStandIndex == null) this.currentStandIndex = 0;
    else if (this.currentStandIndex < this.stands.length - 1) {
      for (let s = this.currentStandIndex + 1; s < this.stands.length; s++) {
        if (!(this.stands[s] instanceof Link)) {
          this.currentStandIndex = s;
          break;
        }
      }
    }
  }

  nextStand() {
    if (this.currentStandIndex == null) return null;
    else if (this.currentStandIndex < this.stands.length - 1) {
      for (let s = this.currentStandIndex + 1; s < this.stands.length; s++) {
        if (!(this.stands[s] instanceof Link)) {
          return this.stands[s];
          break;
        }
      }
    }
  }

  noMoreStands() {
    // tells if the current stand is the last one (not counting links)
    var lastStand = true;
    for (let s = this.currentStandIndex + 1; s < this.stands.length; s++) {
      if (!(this.stands[s] instanceof Link)) {
        lastStand = false;
        break;
      }
    }
    return lastStand;
  }

  goPreviousStand() {
    if (this.currentStandIndex > 0) {
      for (let s = this.currentStandIndex - 1; s >= 0; s--) {
        if (
          !(this.stands[s] instanceof Link) &&
          !(this.stands[s] instanceof Teleporter)
        ) {
          this.currentStandIndex = s;
          break;
        }
      }
    }
  }

  setCurrentStand(name) {
    for (const stand of this.stands) {
      if (stand.name == name) var st = this.stands.indexOf(stand);
    }
    if (this.stands[st] instanceof Link) {
      this.stands[st].openLink();
    } else {
      this.currentStandIndex = st;
      this.immersionUI.currentButton.isEnabled = false;
      if (this.currentStandIndex > 0) {
        this.immersionUI.previousButton.isEnabled = true;
      } else {
        this.immersionUI.previousButton.isEnabled = false;
      }
      if (this.currentStandIndex < this.stands.length - 1) {
        if (this.noMoreStands()) {
          this.immersionUI.nextButton.isEnabled = false;
        } else {
          this.immersionUI.nextButton.isEnabled = true;
        }
      } else {
        this.immersionUI.nextButton.isEnabled = true;
      }

      this.stands[this.currentStandIndex].attachCamera(true);
    }
  }

  currentStand() {
    return this.stands[this.currentStandIndex];
  }

  findStandByName(name) {
    if (this.stands !== null && this.stands) {
      for (const stand of this.stands) {
        if (stand.name == name) return stand;
      }
    }
  }

  /**
   * Adds a background sound to the scene.
   *
   * @param {string} music - The URL or path to the sound file.
   * @param {BABYLON.Vector3} [position] - The position of the sound in the scene (optional).
   * @param {number} [distance] - The maximum distance at which the sound can be heard (optional).
   * @memberof Immersion
   */
  addSound(music, position, distance) {
    var element = new Object();
    element.data = music;
    if (position) element.position = position;
    if (distance) element.distance = distance;
    this.sceneSounds.push(element);
  }

  /**
   * Plays all background sounds in the scene.
   *
   * @memberof Immersion
   */
  playSounds() {
    this.sceneSounds.forEach((element) => {
      if (element.sound == null) {
        var spatial = false;
        var distance = 100;
        if (element.position) spatial = true;
        if (element.distance) distance = element.distance;
        let m = new BABYLON.Sound("music", element.data, this, null, {
          loop: true,
          autoplay: true,
          maxDistance: distance,
          spatialSound: spatial,
        });
        if (element.position) m.setPosition(element.position);
        element.sound = m;
      }
    });
  }

  /**
   * Mutes all audio in the scene.
   *
   * @memberof Immersion
   */
  muteAll() {
    BABYLON.Engine.audioEngine.setGlobalVolume(0);
    MUTE = true;
    // Update sound icon through centralized UI function
    if (this.immersionUI && this.immersionUI.updateSoundIcon) {
      this.immersionUI.updateSoundIcon(true);
    }
  }

  /**
   * Unmutes all audio in the scene.
   *
   * @memberof Immersion
   */
  unmuteAll(force) {
    if (!MUTE || force) {
      BABYLON.Engine.audioEngine.unlock();
      this.playSounds();
      BABYLON.Engine.audioEngine.setGlobalVolume(1);
      MUTE = false;
      // Update sound icon through centralized UI function
      if (this.immersionUI && this.immersionUI.updateSoundIcon) {
        this.immersionUI.updateSoundIcon(false);
      }
    }
  }

  /**
   * Plays a click sound effect.
   *
   * @memberof Immersion
   */
  playClick() {
    if (MUTE == false) {
      if (this.click == null) {
        this.click = new BABYLON.Sound("click", this.clickData, this, null, {
          loop: false,
          autoplay: true,
          spatialSound: false,
        });
      } else this.click.play(0);
    }
    this.unmuteAll();
  }

  /**
   * Automated actions performed on every frame.
   * Manages camera updates, mesh visibility, and UI state changes.
   *
   * @memberof Immersion
   */
  automatedActions() {
    // called before every frame
    /* Detects click and pointer interactions */
    this.onPointerObservable.add((pointerInfo) => {
      if (MODE !== "dvp") {
        this.immersionUI.currentButton.isEnabled = true;
        if (DEST && MODE == "screenshot") this.activeCamera.anim.stop(); // stop rotating animation
      }
      if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh) {
        switch (pointerInfo.type) {
          case BABYLON.PointerEventTypes.POINTERDOWN:
            if (pointerInfo.pickInfo.hit) {
              // in dvp mode, display mesh positions when clicked
              var meshPosition =
                pointerInfo.pickInfo.pickedMesh.getAbsolutePosition();
              if (MODE == "dvp")
                console.log(
                  pointerInfo.pickInfo.pickedMesh.name +
                    ": x:" +
                    meshPosition.x.toFixed(1) +
                    ",y:" +
                    meshPosition.y.toFixed(1) +
                    ",z:" +
                    meshPosition.z.toFixed(1)
                );
            }
            break;
        }
      }
    }, BABYLON.PointerEventTypes.POINTERDOWN);

    // Key event handler for copying coordinates display text in dvp mode
    window.addEventListener("keydown", function (event) {
      if (event.key === "c" && MODE === "dvp") {
        const coordinatesText = scene.immersionUI.coordinatesDisplay.text;
        navigator.clipboard.writeText(coordinatesText).then(
          function () {
            console.log("Coordinates copied to clipboard:", coordinatesText);
          },
          function (err) {
            console.error("Could not copy text: ", err);
          }
        );
      }
    });

    var scene = this;
    scene.counterCheckDistance = 0;
    scene.registerBeforeRender(function () {
      // change settings is user is seated
      
      if (scene.inXR == true) {
        if (
          scene.activeCamera.position.y < 1.25 &&
          scene.userPosition == "standing"
        ) {
          scene.userPosition = "seated";
          for (const stand of scene.stands) {
            if (stand.plinth) {
              stand.plinth.position.y = stand.plinth.position.y - 0.6;
              stand.plinthBase.position.y = stand.plinthBase.position.y + 0.6;
              stand.plinth.isVisible = true;
              stand.plinthBase.isVisible = true;
            }
          }
        } else if (
          scene.activeCamera.position.y >= 1.25 &&
          scene.userPosition == "seated"
        ) {
          scene.userPosition = "standing";
          for (const stand of scene.stands) {
            if (stand.plinth) {
              stand.plinth.position.y = stand.plinth.position.y + 0.6;
              stand.plinthBase.position.y = stand.plinthBase.position.y - 0.6;
              stand.plinth.isVisible = true;
              stand.plinthBase.isVisible = true;
            }
          }
        }
      }
      
      // Recomputes camera position based on updated target
      if (MODE !== "dvp" && scene.inXR == false && scene.cameraMoving == true) {
        scene.activeCamera.position = scene.activeCamera._p;
        scene.activeCamera.rebuildAnglesAndRadius();
      }
      // Updates all meshes having a calledOnEveryFrame function
      scene.meshes.forEach((element) => {
        if (element.calledOnEveryFrame) element.calledOnEveryFrame(scene);
      });
      scene.counterCheckDistance++;

      if (scene.counterCheckDistance == 10) {
        scene.meshes.forEach((element) => {
          if (element.hidingDistance) {
            var global_position = element.position;
            if (element.parent && element.parent.position) {
              // if no parent or parent is a root (instantiateModelsToScene from Mixamo)
              const matrix = element.computeWorldMatrix(true);
              global_position = BABYLON.Vector3.TransformCoordinates(
                element.position,
                matrix
              );
            }
            if (
              global_position.subtract(scene.activeCamera.position).length() <
                element.hidingDistance &&
              !element.isEnabled()
            ) {
              element.setEnabled(true);
            } else if (
              global_position.subtract(scene.activeCamera.position).length() >=
                element.hidingDistance &&
              element.isEnabled()
            ) {
              element.setEnabled(false);
            }
          }
        });
        scene.counterCheckDistance = 0;
      }

      // Loads assets and displays loading animation until everything is loaded
      if (scene.loadingCounter && scene.loadingCounter !== null) {
        if (scene.loadingCounter == 140) scene.assetsManager.load();
        if (scene.loadingCounter <= 0) scene.loadingCounter = 121;
        scene.loadingCounter--;
        if (scene.loadingCounter == 120) engine.loadingUIText = scene.loading;
        else if (scene.loadingCounter == 90)
          engine.loadingUIText = scene.loading + ".";
        else if (scene.loadingCounter == 60)
          engine.loadingUIText = scene.loading + "..";
        else if (scene.loadingCounter == 30)
          engine.loadingUIText = scene.loading + "...";
      }
    });
  }

  /** Adds snap points for VR teleportation to specified positions.
   *
   * @param {BABYLON.WebXRTeleportation} xrTeleportation - The teleportation feature instance.
   * @memberof Immersion
   */
  addingSnapPoints(xrTeleportation) {
    for (const stand of this.stands) {
      xrTeleportation.addSnapPoint(stand.position);
    }
  }

  /**
   * Updates the navigation UI and state when entering VR mode.
   * Disposes of the fullscreen UI and resets mute state.
   *
   * @memberof Immersion
   */
  updateXRNavigation() {
    this.immersionUI.fullscreenUI.dispose();
    MUTE = false;
    for (const stand of this.stands) {
    }
  }

  //////////////////////////////////////////////////////////////////////////////////
  // immersion function to highlight a stand or standBox
  highlight(mesh) {
    mesh.edgesColor = new BABYLON.Color4(1, 1, 1, 1);
    mesh.enableEdgesRendering();
    mesh.edgesWidth = 0;
    mesh.actionManager = new BABYLON.ActionManager(this);
    mesh.clicked = false;
    var scene = this;
    mesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOverTrigger,
        function (ev) {
          if (mesh.name == "standWindow" || mesh.name == "soundButton")
            mesh.edgesWidth = 0.2;
          else mesh.material = scene.selectionMaterial;
        }
      )
    );
    mesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOutTrigger,
        function (ev) {
          if (mesh.name == "standWindow" || mesh.name == "soundButton")
            mesh.edgesWidth = 0;
          else if (mesh.clicked == false) {
            if (mesh.parent.gate && mesh.parent.gate.includes("/"))
              mesh.material = scene.clickLinkMaterial;
            else mesh.material = scene.standMaterial;
          }
        }
      )
    );
    return mesh.actionManager;
  }

  //////////////////////////////////////////////////////////////////////////////////
  // immersion function to highlight a mesh when pointer is over
  addInteraction(mesh, unlock, standName) {
    if (unlock) {
      this.locks++; // Increment lockCounter when unlocking
      // Update lock counter badges in UI when new locks are added
      if (this.immersionUI && this.immersionUI.updateLockCounterBadges) {
        this.immersionUI.updateLockCounterBadges(this);
      }
    }

    const scene = this;
    const rootMesh = mesh; // keep a single lockable state on the root
    rootMesh.lockable = !!unlock;

    let targets;
    if (Array.isArray(mesh)) {
      targets = mesh;
    } else {
      targets = [mesh];
    }
    // For each target, set up visuals and actions
    targets.forEach((m) => {
      //m.edgesColor = new BABYLON.Color4(1, 1, 1, 1);
      //m.enableEdgesRendering();
      //m.edgesWidth = 0;
      m.actionManager = new BABYLON.ActionManager(scene);
      // Only the root carries the lockable state. Children mirror visuals only.
      if (m !== rootMesh) m.lockable = false;
      m.alwaysSelectAsActiveMesh = true;
      m.defaultMaterial = m.material;
      m.defaultFog=m.applyFog;

      // Hover in
      m.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger,
          function () {
            if (
              standName == undefined ||
              scene.currentStand().name == standName
            ) {
              m.material = scene.selectionMaterial;
              if (m.defaultMaterial.backFaceCulling == false)
                m.material.backFaceCulling = false;
                m.applyFog = false;
                m.actionManager.hoverCursor = "pointer";
            } else m.actionManager.hoverCursor = "default";
          }
        )
      );

      // Hover out
      m.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger,
          function () {
            if (
              standName == undefined ||
              scene.currentStand().name == standName
            ) {
              m.material = m.defaultMaterial;
              m.applyFog = m.defaultFog;
            }
          }
        )
      );

      // Click / pick
      m.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          function () {
            if (
              standName == undefined ||
              scene.currentStand().name == standName
            ) {
              // m.defaultMaterial=scene.selectionMaterial;
              m.material = m.defaultMaterial;
              // Use the root mesh to manage the single unlock state
              if (rootMesh.lockable) {
                rootMesh.lockable = false;
                scene.unlocks++;
                // Update lock counter badges in UI
                if (
                  scene.inXR == false &&
                  scene.immersionUI &&
                  scene.immersionUI.updateLockCounterBadges
                ) {
                  scene.immersionUI.updateLockCounterBadges(scene);
                }
                // Show progress message
                if (!MUTE) {
                  const remainingLocks = scene.locks - scene.unlocks;
                  if (remainingLocks > 2) {
                    const newItemSoundInstance = new Audio(
                      scene.soundsp.newItem
                    );
                    newItemSoundInstance.play();
                  } else if (remainingLocks === 2) {
                    const twoLeftSoundInstance = new Audio(
                      scene.soundsp.twoLeft
                    );
                    twoLeftSoundInstance.play();
                  } else if (remainingLocks === 1) {
                    console.log(scene.soundsp.oneLeft);
                    const oneLeftSoundInstance = new Audio(
                      scene.soundsp.oneLeft
                    );
                    oneLeftSoundInstance.play();
                  } else if (remainingLocks === 0) {
                    const missionCompleteSoundInstance = new Audio(
                      scene.soundsp.missionComplete
                    );
                    missionCompleteSoundInstance.play();
                  }
                }
                if (
                  scene.inXR == false &&
                  scene.immersionUI &&
                  scene.immersionUI.showProgressMessage
                ) {
                  scene.immersionUI.showProgressMessage(scene);
                }
                if (scene.unlocks == scene.locks) {
                  console.log("All meshes unlocked.");
                  scene.doWhenAllUnlocked();
                } else
                  console.log(scene.unlocks, " /", scene.locks, " unlocked.");
                m.actionManager = null;
              }
            }
          }
        )
      );
    });

    // Return the root action manager for convenience
    return rootMesh.actionManager;
  }

  openLink(link,tab) {
    this.muteAll();
    if (this.inXR == true) {
      this.xr.baseExperience.exitXRAsync();
      window.open(link, tab);
    }else{
      if (window.top !== window.self) {
        // inside an iframe → redirect the parent
        window.top.location.href = link;
      } else {
        // not in iframe → redirect current page
        window.location.href = link;
      }
    }
  }

  doWhenAllUnlocked() {}
}

/**
 * Creates and initializes an immersive 3D experience with BabylonJS.
 * Sets up the engine, scene, XR capabilities, and handles global configuration.
 *
 * @function createImmersion
 * @param {class} ImmersionClass - The immersion class constructor to instantiate
 * @param {string} [lang_p] - Language code for localization (e.g., "en", "fr")
 * @param {string} [dest_p] - Destination parameter for initial navigation
 * @param {string} [mode_p] - Rendering mode ("dvp","screenshot","minimal")
 * @param {boolean} [mute_p] - Whether to start with audio muted
 * @since 0.1.0
 */
function createImmersion(ImmersionClass, lang_p, dest_p, mode_p, mute_p) {
  const ASSET_PATHS = [
    { name: "aboutIcon", src: "/immersion_engine/assets/about.png" },
    { name: "aboutIconW", src: "/immersion_engine/assets/about-w.png" },
    { name: "shareIcon", src: "/immersion_engine/assets/share.png" },
    { name: "shareIconW", src: "/immersion_engine/assets/share-w.png" },
    { name: "nextIcon", src: "/immersion_engine/assets/next.png" },
    { name: "nextIconW", src: "/immersion_engine/assets/next-w.png" },
    { name: "previousIcon", src: "/immersion_engine/assets/previous.png" },
    { name: "previousIconW", src: "/immersion_engine/assets/previous-w.png" },
    { name: "muteIcon", src: "/immersion_engine/assets/mute.png" },
    { name: "muteIconW", src: "/immersion_engine/assets/mute-w.png" },
    { name: "unmuteIcon", src: "/immersion_engine/assets/unmute.png" },
    { name: "unmuteIconW", src: "/immersion_engine/assets/unmute-w.png" },
    { name: "recenterIcon", src: "/immersion_engine/assets/recenter.png" },
    { name: "recenterIconW", src: "/immersion_engine/assets/recenter-w.png" },
    { name: "badgeIcon", src: "/immersion_engine/assets/badge.png" },
    {
      name: "badgeUnlockedIcon",
      src: "/immersion_engine/assets/badge_unlocked.png",
    },
    { name: "openSourceIcon", src: "/immersion_engine/assets/open-source.png" },
    {
      name: "openSourceIconW",
      src: "/immersion_engine/assets/open-source-w.png",
    },
    {
      name: "missionCompleteSound",
      src: "/immersion_engine/assets/mission-complete.mp3",
    },
    { name: "newItemSound", src: "/immersion_engine/assets/new-item.mp3" },
    { name: "twoLeftSound", src: "/immersion_engine/assets/two-left.mp3" },
    { name: "oneLeftSound", src: "/immersion_engine/assets/one-left.mp3" },
    { name: "immersionData", src: "/immersion_engine/immersion.json" },
  ];

  function preloadAssets(paths) {
    const loaders = paths.map(({ name, src }) => {
      const fail = (msg) => new Error(`[preload] ${name}: ${msg} (${src})`);

      if (/\.(png|jpe?g|gif|webp)$/i.test(src)) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = async () => {
            try {
              if (img.decode) await img.decode();
            } catch (_) {}
            resolve({ name, src, element: img });
          };
          img.onerror = () => reject(fail("image failed to load"));
          img.src = src;
        });
      }

      if (/\.(mp3|wav|m4a|aac)$/i.test(src)) {
        return new Promise((resolve, reject) => {
          const audio = new Audio();
          // iOS-friendly hints
          audio.preload = "auto";
          audio.playsInline = true; // webkit inline playback
          audio.muted = true; // optional: improves buffering on iOS

          const cleanup = () => {
            audio.removeEventListener("loadedmetadata", onReady);
            audio.removeEventListener("canplay", onReady);
            audio.removeEventListener("error", onErr);
          };
          const onReady = () => {
            cleanup();
            resolve({ name, src, element: audio });
          };
          const onErr = () => {
            cleanup();
            reject(fail("audio failed to load"));
          };

          audio.addEventListener("loadedmetadata", onReady, { once: true });
          audio.addEventListener("canplay", onReady, { once: true });
          audio.addEventListener("error", onErr, { once: true });

          audio.src = src;
          // Do NOT call play() here—iOS blocks without a user gesture.
          // We only preload enough metadata to know the asset is valid.
        });
      }

      if (/\.json$/i.test(src)) {
        return fetch(src, { cache: "no-cache" })
          .then((r) => {
            if (!r.ok) throw fail(`json ${r.status}`);
            return r.json();
          })
          .then((data) => ({ name, src, element: data }))
          .catch((e) => {
            throw fail(e.message || "json fetch failed");
          });
      }

      return Promise.reject(fail("unsupported file type"));
    });

    return Promise.allSettled(loaders).then((results) => {
      const ok = [];
      const errors = [];
      results.forEach((r) =>
        r.status === "fulfilled" ? ok.push(r.value) : errors.push(r.reason)
      );
      if (errors.length) {
        // Log but don’t block the app; adjust to your tolerance
        console.warn("[preload] some assets failed:", errors);
      }
      return ok;
    });
  }

  preloadAssets(ASSET_PATHS)
    .then((assets) => {
      assets.forEach(({ name, element }) => {
        window[name] = element;
      });
      // If you muted audio above, unmute later after a user gesture if you need sound:
      // window.missionCompleteSound.muted = false; // etc.
      createImmersion2(ImmersionClass, lang_p, dest_p, mode_p, mute_p);
    })
    .catch((err) => {
      console.error("[preload] fatal:", err);
      // Optional: continue anyway
      createImmersion2(ImmersionClass, lang_p, dest_p, mode_p, mute_p);
    });
}

function createImmersion2(ImmersionClass, lang_p, dest_p, mode_p, mute_p) {
  // initiate global variables (if not already set) ////////////////////////////////
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  window.DEVICE = "desktop";
  window.LANG = "en";
  window.MUTE = true;
  window.MODE = "arc";
  window.DEST = null;
  if (mode_p) MODE = mode_p;
  else if (mode_p == null && urlParams.has("mode"))
    MODE = urlParams.get("mode");
  if (mute_p) MUTE = mute_p;
  else if (mute_p == null && urlParams.has("mute"))
    MUTE = urlParams.get("mute");
  if (dest_p) DEST = dest_p;
  else if (dest_p == null && urlParams.has("dest"))
    DEST = urlParams.get("dest");
  if (lang_p) LANG = lang_p;
  else if (lang_p == null && urlParams.has("lang"))
    LANG = urlParams.get("lang");
  // Engine path parameter is no longer used
  const ua = navigator.userAgent;
  const deviceType = () => {
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    } else if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return "mobile";
    }
    return "desktop";
  };
  DEVICE = deviceType();
  window.canvas = document.getElementById("renderCanvas");
  // Initiates the babylon engine //////////////////////////////////////////////////
  let sceneToRender = null;
  let createDefaultEngine = function () {
    return new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      disableWebGL2Support: false,
      audioEngine: true,
      audioEnabled: true,
    });
  };
  let initImmersion = async function () {
    let scene = new ImmersionClass(engine);
    await scene.init();
    // Attach camera controls now that canvas and engine are available
    if (MODE == "dvp" || MODE == "screenshot" || (MODE !== "minimal" && !DEST))
      scene.camera.attachControl(canvas, false);
    try {
      scene.xr = await scene.createDefaultXRExperienceAsync({
        floorMeshes: [scene.ground],
      });
      const xrTeleportation = scene.xr.baseExperience.featuresManager;
      xrTeleportation.enableFeature(
        //BABYLON.WebXRFeatureName.LAYERS,
        //"latest",
        //{ preferMultiviewOnInit: true },
        BABYLON.WebXRFeatureName.POINTER_SELECTION,
        "stable",
        {
          xrInput: scene.xr.input,
          enablePointerSelectionOnAllControllers: true, // includes hands
          useUtilityLayer: false,
        }
      );
      xrTeleportation.enableFeature(
        BABYLON.WebXRFeatureName.TELEPORTATION,
        "stable",
        {
          xrInput: scene.xr.input,
          floorMeshes: [scene.ground],
          timeToTeleport: 1000,
          defaultTargetMeshOptions: {
            torusArrowMaterial: scene.XRTeleportMaterial,
            disableLighting: true,
            snapToPositionRadius: 2,
          },
        }
      );

      scene.xr.baseExperience.sessionManager.onXRSessionInit.add(
        (xrSession) => {
          //if (layers?.projectionLayer && "fixedFoveation" in layers.projectionLayer) {
          //  layers.projectionLayer.fixedFoveation = 0.5;  // start moderate, tune 0.3–0.7
          //}
          scene.updateXRNavigation();
          scene.performancePriority =
            BABYLON.ScenePerformancePriority.Intermediate;
          scene.inXR = true;
          scene.xr.baseExperience.sessionManager.baseReferenceSpace =
            xrSession.requestReferenceSpace("local");
          scene.activeCamera.position.y = scene.viewHeight;
        }
      );
    } catch (e) {}
    return scene;
  };
  window.initFunction = async function () {
    let asyncEngineCreation = async function () {
      try {
        return createDefaultEngine();
      } catch (e) {
        console.log(
          "the available createEngine function failed. Creating the default engine instead"
        );
        return createDefaultEngine();
      }
    };
    window.engine = await asyncEngineCreation();
    if (!engine) throw "engine should not be null.";
    window.scene = initImmersion();
  };
  initFunction().then(() => {
    scene.then((returnedScene) => {
      sceneToRender = returnedScene;
    });
    engine.runRenderLoop(function () {
      if (sceneToRender && sceneToRender.activeCamera) {
        sceneToRender.render();
      }
    });
  });
  window.addEventListener("resize", function () {
    engine.resize();
  });
}
