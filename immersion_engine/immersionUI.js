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

class ImmersionUI {
  constructor(scene) {
    this.scene = scene;
    this.fontName = "Tahoma, Georgia"; //Tahoma, Georgia
    this.style = scene.style; // Get style from scene

    // Define asset URLs for icons and audio
    const assetBasePath = "/immersion_engine/assets/";

    // Set up icon references based on theme
    this.icons = {
      about:
        this.style === "light"
          ? assetBasePath + "about.png"
          : assetBasePath + "about-w.png",
      share:
        this.style === "light"
          ? assetBasePath + "share.png"
          : assetBasePath + "share-w.png",
      next:
        this.style === "light"
          ? assetBasePath + "next.png"
          : assetBasePath + "next-w.png",
      previous:
        this.style === "light"
          ? assetBasePath + "previous.png"
          : assetBasePath + "previous.png",
      mute:
        this.style === "light"
          ? assetBasePath + "mute.png"
          : assetBasePath + "mute-w.png",
      unmute:
        this.style === "light"
          ? assetBasePath + "unmute.png"
          : assetBasePath + "unmute-w.png",
      recenter:
        this.style === "light"
          ? assetBasePath + "recenter.png"
          : assetBasePath + "recenter.png",
      badge: assetBasePath + "badge.png",
      badgeUnlocked: assetBasePath + "badge_unlocked.png",
      openSource:
        this.style === "light"
          ? assetBasePath + "open-source.png"
          : assetBasePath + "open-source-w.png",
      // White versions for special cases (like next button)
      nextWhite: assetBasePath + "next-w.png",
      muteWhite: assetBasePath + "mute-w.png",
      unmuteWhite: assetBasePath + "unmute-w.png",
    };

    this.fullscreenUI =
      BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    if (MODE == "screenshot") this.fullscreenUI.idealHeight = 1500;
    else if (window.innerHeight <= 500) this.fullscreenUI.idealHeight = 550;
    else this.fullscreenUI.idealHeight = 800;
    if (this.style == "light") var bgcolour = "white";
    else var bgcolour = "black";
    if (this.style == "light") var textcolour = "black";
    else var textcolour = "white";

    // sound button - handle initial mute status
    const initialMuted = MUTE === true;
    const initialIcon = this.icons.unmute; // Always start with unmute icon, will be updated after creation
    const initialBackground = initialMuted ? "#ff8efd" : bgcolour;

    var soundButton = BABYLON.GUI.Button.CreateImageButton(
      "soundButton",
      "",
      initialIcon
    );
    soundButton.fontSize = "14px";
    soundButton.height = "60px";
    soundButton.width = "80px";
    soundButton.paddingLeft = "10px";
    soundButton.paddingTop = "10px";
    soundButton.cornerRadius = 10;
    soundButton.color = "transparent";
    soundButton.fontFamily = this.fontName;
    soundButton.thickness = 0;
    soundButton.background = initialBackground;
    soundButton.alpha = 1;
    soundButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    soundButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    soundButton.scene = scene;
    // Center and scale the icon to fill the button
    soundButton.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    soundButton.image.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    soundButton.image.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    soundButton.image.widthInPixels = 42;
    soundButton.image.heightInPixels = 42;
    soundButton.cursor = "pointer"; // Show hand cursor on hover
    soundButton.onPointerUpObservable.add(function () {
      if (MUTE == true) {
        soundButton.scene.unmuteAll(true); // Force unmute when button is clicked
      } else if (MUTE == false) {
        soundButton.scene.muteAll();
      }
    });
    this.fullscreenUI.addControl(soundButton);
    this.soundButton = soundButton;

    // Update the sound button immediately after creation to ensure proper icon display
    this.updateSoundIcon(MUTE === true);
    // about button
    var aboutButton = BABYLON.GUI.Button.CreateImageButton(
      "aboutButton",
      "",
      this.icons.about
    );
    aboutButton.fontSize = "14px";
    aboutButton.height = "50px";
    aboutButton.width = "80px";
    aboutButton.paddingRight = "10px";
    aboutButton.top = "10px";
    aboutButton.fontFamily = this.fontName;
    aboutButton.cornerRadius = 10;
    aboutButton.color = "transparent"; // No border
    aboutButton.thickness = 0;
    aboutButton.background = scene.style == "light" ? "#ffffff" : "#333333"; // Theme-appropriate background like current/previous buttons
    aboutButton.alpha = 0.9;
    aboutButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    aboutButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    aboutButton.scene = scene;
    // Use preprocessed icon based on theme
    aboutButton.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    aboutButton.image.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    aboutButton.image.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    // Make the image take up more space in the button
    aboutButton.image.widthInPixels = 42;
    aboutButton.image.heightInPixels = 42;
    aboutButton.image.source = this.icons.about;
    aboutButton.link = scene.texts.aboutLink;
    aboutButton.cursor = "pointer"; // Show hand cursor on hover
    this.aboutButton = aboutButton; // Store reference for later updates
    aboutButton.onPointerUpObservable.add(function () {
      //aboutButton.scene.muteAll();
      // Show the centered modal buttons (open source, about, cancel)
      if (
        aboutButton.scene.immersionUI &&
        aboutButton.scene.immersionUI.toggleAboutModal
      ) {
        aboutButton.scene.immersionUI.toggleAboutModal();
      }
    });
    this.fullscreenUI.addControl(aboutButton);
    this.aboutButton = aboutButton;
    // Create hidden centered buttons shown when pressing the about button
    this.createAboutModalButtons(scene);
    // Create three centered buttons that appear when pressing the about button

    // Full Immersion button
    var fullImmersionButton = BABYLON.GUI.Button.CreateSimpleButton(
      "fullImmersionButton",
      scene.texts.fullText
    );
    fullImmersionButton.fontSize = "16px";
    fullImmersionButton.height = "50px";
    fullImmersionButton.width = "80px";
    fullImmersionButton.paddingRight = "10px";
    fullImmersionButton.top = "10px";
    fullImmersionButton.fontFamily = this.fontName;
    fullImmersionButton.textBlock.fontWeight = "bold";
    fullImmersionButton.cornerRadius = 10;
    fullImmersionButton.color = "transparent"; // No border
    fullImmersionButton.thickness = 0;
    fullImmersionButton.background =
      scene.style == "light" ? "#ffffff" : "#333333"; // Theme-appropriate background like current/previous buttons
    fullImmersionButton.alpha = 0.9;
    fullImmersionButton.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    fullImmersionButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    fullImmersionButton.scene = scene;
    fullImmersionButton.textBlock.color =
      scene.style === "light" ? "black" : "white";
    fullImmersionButton.fontFamily = this.fontName;
    fullImmersionButton.color = "black";
    fullImmersionButton.thickness = 0;
    fullImmersionButton.link = scene.texts.fullLink;
    fullImmersionButton.cursor = "pointer"; // Show hand cursor on hover
    this.fullImmersionButton = fullImmersionButton; // Store reference for later updates
    fullImmersionButton.onPointerUpObservable.add(function () {
      scene.openLink(fullImmersionButton.link,"play");
    });
    this.fullscreenUI.addControl(fullImmersionButton);
    this.fullImmersionButton = fullImmersionButton;
    this.fullImmersionButton.isVisible = false;

    // Share button
    var shareButton = BABYLON.GUI.Button.CreateImageButton(
      "shareButton",
      "",
      this.icons.share
    );
    shareButton.fontSize = "14px";
    shareButton.height = "50px";
    shareButton.width = "80px";
    shareButton.paddingRight = "10px";
    shareButton.top = "70px";
    shareButton.fontFamily = this.fontName;
    shareButton.cornerRadius = 10;
    shareButton.color = "transparent"; // No border
    shareButton.thickness = 0;
    shareButton.background = scene.style == "light" ? "#ffffff" : "#333333"; // Theme-appropriate background like current/previous buttons
    shareButton.alpha = 0.9;
    shareButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    shareButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    shareButton.scene = scene;
    // Center and scale the icon to fill the button
    shareButton.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    shareButton.image.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    shareButton.image.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    shareButton.image.widthInPixels = 42;
    shareButton.image.heightInPixels = 42;
    // Use preprocessed icon based on theme
    shareButton.image.source = this.icons.share;
    shareButton.cursor = "pointer"; // Show hand cursor on hover
    this.shareButton = shareButton; // Store reference for later updates
    shareButton.onPointerUpObservable.add(() => {
      // Copy current URL to clipboard
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          // Show message that link is copied
          if (scene.immersionUI && scene.immersionUI.showShareMessage) {
            scene.immersionUI.showShareMessage();
          }
        })
        .catch(() => {
          // Fallback if clipboard API not available
          if (scene.immersionUI && scene.immersionUI.showShareMessage) {
            scene.immersionUI.showShareMessage();
          }
        });
    });
    this.fullscreenUI.addControl(shareButton);
    this.shareButton = shareButton;
    this.shareButton.isVisible = false;

    // Open Source button
    var exitButton = BABYLON.GUI.Button.CreateSimpleButton(
      "simpleButton",
      scene.texts.exitText,
      ""
    );
    exitButton.fontSize = "20px";
    exitButton.height = "50px";
    exitButton.width = "80px";
    exitButton.paddingRight = "10px";
    exitButton.top = "70px";
    exitButton.fontFamily = this.fontName;
    exitButton.textBlock.fontWeight = "bold";
    exitButton.fontSize = "20px";
    exitButton.cornerRadius = 10;
    exitButton.color = scene.style == "dark" ? "#ffffff" : "#333333";
    exitButton.thickness = 0;
    exitButton.background = scene.style == "light" ? "#ffffff" : "#333333";
    exitButton.alpha = 0.9;
    exitButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    exitButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    exitButton.scene = scene;
    exitButton.cursor = "pointer"; // Show hand cursor on hover
    this.exitButton = exitButton; // Store reference for later updates
    exitButton.onPointerUpObservable.add(function () {
      scene.openLink(scene.texts.exitLink,"exit");
    });
    this.fullscreenUI.addControl(exitButton);
    this.exitButton = exitButton;
    // next button - use placeholder, will be updated after creation
    const immersionUI = this;
    var nextButton = BABYLON.GUI.Button.CreateImageButton(
      "nextButton",
      "",
      this.icons.next
    );
    nextButton.fontSize = "30px";
    nextButton.height = "70px";
    nextButton.width = "80px";
    nextButton.marginTop = "10px";
    nextButton.paddingRight = "10px";
    nextButton.top = "-170px"; // Stack like badges: top button, 10px higher
    nextButton.cornerRadius = 10;
    nextButton.color = "transparent"; // No border
    nextButton.thickness = 0;
    nextButton.background = "#39e600"; // Initial green
    // Oscillate background between green and purple until first click or XR is active
    if (!scene.inXR) {
      // Smooth progressive color switch helpers
      const fromHex = "#39e600"; // green
      const toHex = "#ff8efd"; // purple
      const hexToRgb = (hex) => {
        const n = hex.replace("#", "");
        const bigint = parseInt(n, 16);
        return {
          r: (bigint >> 16) & 255,
          g: (bigint >> 8) & 255,
          b: bigint & 255,
        };
      };
      const rgbToHex = ({ r, g, b }) => {
        const c = (v) => v.toString(16).padStart(2, "0");
        return `#${c(r)}${c(g)}${c(b)}`;
      };
      const lerp = (a, b, t) => Math.round(a + (b - a) * t);
      const lerpRgb = (c1, c2, t) => ({
        r: lerp(c1.r, c2.r, t),
        g: lerp(c1.g, c2.g, t),
        b: lerp(c1.b, c2.b, t),
      });
      const fromRgb = hexToRgb(fromHex);
      const toRgb = hexToRgb(toHex);
      let phase = 0; // radians
      const step = (2 * Math.PI) / 60; // ~60 steps per cycle (~1.8s at 30ms interval)
      immersionUI._nextPulseInterval = setInterval(() => {
        // Stop if clicked once or XR becomes active
        if (immersionUI._nextClicked || scene.inXR) {
          clearInterval(immersionUI._nextPulseInterval);
          immersionUI._nextPulseInterval = null;
          nextButton.background = "#39e600"; // settle on green
          return;
        }
        // Compute blend factor with a sine wave for smooth ping-pong [0..1]
        phase += step;
        const t = (Math.sin(phase) + 1) / 2;
        const rgb = lerpRgb(fromRgb, toRgb, t);
        nextButton.background = rgbToHex(rgb);
      }, 30);
    } else {
      nextButton.background = "#39e600";
    }
    nextButton.alpha = 1.0;
    nextButton.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    nextButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    nextButton.scene = scene;
    // Center and scale the icon to fill the button
    nextButton.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    nextButton.image.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    nextButton.image.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    nextButton.image.widthInPixels = 42;
    nextButton.image.heightInPixels = 42;
    nextButton.cursor = "pointer"; // Show hand cursor on hover
    nextButton.onPointerUpObservable.add(function () {
      immersionUI._nextClicked = true;
      if (immersionUI._nextPulseInterval) {
        clearInterval(immersionUI._nextPulseInterval);
        immersionUI._nextPulseInterval = null;
        nextButton.background = "#39e600";
      }
      nextButton.scene.unmuteAll();
      if (
        nextButton.scene.stands[nextButton.scene.currentStandIndex + 1].name ==
          "GATE_STAND" &&
        nextButton.scene.stands[nextButton.scene.currentStandIndex + 1]
          .standSign.isPickable == false
      ) {
        // still loading
      } else {
        nextButton.scene.goNextStand();
        nextButton.scene.immersionUI.currentButton.isEnabled = false;
        nextButton.scene.immersionUI.previousButton.isEnabled = true;
        if (
          nextButton.scene.currentStandIndex <
          nextButton.scene.stands.length - 1
        ) {
          if (nextButton.scene.noMoreStands()) {
            nextButton.isEnabled = false;
          } else {
            nextButton.isEnabled = true;
          }
        } else {
          nextButton.isEnabled = true;
        }

        nextButton.scene.currentStand().attachCamera(true);
      }
    });
    this.fullscreenUI.addControl(nextButton);
    this.nextButton = nextButton;

    // Special case: next button always uses white icon regardless of theme
    nextButton.image.source = this.icons.nextWhite;
    // previous button
    var previousButton = BABYLON.GUI.Button.CreateImageButton(
      "previousButton",
      "",
      this.icons.previous
    );
    previousButton.fontSize = "30px";
    previousButton.height = "70px";
    previousButton.width = "80px";
    previousButton.marginTop = "70px";
    previousButton.paddingRight = "10px";
    previousButton.top = "-10px"; // Stack like badges: bottom button, 10px higher
    previousButton.cornerRadius = 10;
    previousButton.color = "transparent"; // No border
    previousButton.thickness = 0;
    previousButton.background = "#ffffff";
    previousButton.alpha = 1.0;
    previousButton.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    previousButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    previousButton.scene = scene;
    // Center and scale the icon to fill the button
    previousButton.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    previousButton.image.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    previousButton.image.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    previousButton.image.widthInPixels = 42;
    previousButton.image.heightInPixels = 42;
    // Use theme-appropriate icon
    previousButton.image.source = this.icons.previous;
    previousButton.cursor = "pointer"; // Show hand cursor on hover
    previousButton.onPointerUpObservable.add(function () {
      previousButton.scene.unmuteAll();
      previousButton.scene.goPreviousStand();
      previousButton.scene.immersionUI.currentButton.isEnabled = false;
      if (previousButton.scene.currentStandIndex > 0) {
        previousButton.isEnabled = true;
      } else {
        previousButton.isEnabled = false;
      }
      previousButton.scene.immersionUI.nextButton.isEnabled = true;

      previousButton.scene.currentStand().attachCamera(true);
    });
    this.fullscreenUI.addControl(previousButton);
    if (this.currentStandIndex !== null && !DEST)
      previousButton.isEnabled = false;
    else previousButton.isEnabled = true;
    this.previousButton = previousButton;
    // current button ("back to position")
    var currentButton = BABYLON.GUI.Button.CreateImageButton(
      "currentButton",
      "",
      this.icons.recenter
    );
    currentButton.cornerRadius = 10;
    currentButton.color = "transparent"; // No border
    currentButton.thickness = 0;
    currentButton.background = "#ffffff";
    currentButton.fontSize = "14px";
    currentButton.fontFamily = this.fontName;
    currentButton.alpha = 1.0;
    currentButton.height = "70px";
    currentButton.width = "80px"; // Same width as next/previous buttons
    currentButton.top = -(1 * 80 + 10) + "px"; // Stack like badges: middle button, 10px higher
    currentButton.marginTop = "70px";
    currentButton.paddingRight = "10px";
    currentButton.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    currentButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    currentButton.scene = scene;
    // Center and scale the icon to fill the button
    currentButton.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    currentButton.image.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    currentButton.image.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    currentButton.image.widthInPixels = 42;
    currentButton.image.heightInPixels = 42;
    // Use preprocessed icon based on theme
    currentButton.image.source = this.icons.recenter;
    currentButton.cursor = "pointer"; // Show hand cursor on hover
    currentButton.onPointerUpObservable.add(function () {
      currentButton.scene.unmuteAll();
      currentButton.isEnabled = false;
      currentButton.scene.currentStand().attachCamera(false);
    });
    this.fullscreenUI.addControl(currentButton);
    currentButton.isEnabled = false;
    this.currentButton = currentButton;

    // Lock counter badges in upper left corner
    this.lockBadges = [];
    if (MODE !== "arc" || !DEST) this.createLockCounterBadges(scene);

    // Progress message for unlock notifications
    this.progressMessage = null;
    this.createProgressMessage();
    // displays coordinates when in dvp mode
    if (MODE == "dvp") {
      if (this.style == "light") var colour = "black";
      else var colour = "white";
      this.coordinatesDisplay = new BABYLON.GUI.TextBlock();
      this.coordinatesDisplay.fontFamily = this.fontName;
      this.coordinatesDisplay.text = "";
      this.coordinatesDisplay.color = colour;
      this.coordinatesDisplay.height = "40px";
      this.coordinatesDisplay.fontSize = "12px";
      this.coordinatesDisplay.top = "-100px";
      this.fullscreenUI.addControl(this.coordinatesDisplay);
      this.coordinatesDisplay.verticalAlignment =
        BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    }
    if (DEST) {
      currentButton.isVisible = false;
      soundButton.isVisible = false;
      nextButton.isVisible = false;
      aboutButton.isVisible = false;
      fullImmersionButton.isVisible = true;
      previousButton.isVisible = false;
      shareButton.isVisible = false;
      exitButton.isVisible = false;
      currentButton.top = "-10px";
      currentButton.horizontalAlignment =
        BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    }
    if (MODE == "minimal") {
      aboutButton.isVisible = false;
      fullImmersionButton.isVisible = true;
      shareButton.isVisible = false;
      exitButton.isVisible = false;
      currentButton.isVisible = false;
      nextButton.verticalAlignment =
        BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
      previousButton.verticalAlignment =
        BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
      previousButton.horizontalAlignment =
        BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      nextButton.top = "0px";
      previousButton.top = "0px";
      previousButton.paddingRight = "0px";
      previousButton.paddingLeft = "10px";
      previousButton.marginTop = "0px";
      nextButton.marginTop = "0px";
    }
    if (MODE == "screenshot") {
      soundButton.isVisible = false;
      currentButton.isVisible = false;
      fullImmersionButton.isVisible = false;
    } else if (MODE == "minimal") {
      soundButton.isVisible = false;
      fullImmersionButton.isVisible = false;
    }
  }

  // Create lock counter badges in bottom left corner
  createLockCounterBadges(scene) {
    if (this.style == "light") var bgcolour = "black";
    else var bgcolour = "white";
    if (this.style == "light") var textcolour = "white";
    else var textcolour = "black";

    // Create badges based on total locks count
    const totalLocks = scene.locks;
    const unlockedCount = scene.unlocks;

    for (let i = 0; i < totalLocks; i++) {
      const isUnlocked = i < unlockedCount;

      // Create badge button with appropriate icon
      const iconToUse = isUnlocked
        ? this.icons.badgeUnlocked
        : this.icons.badge;
      const lockBadge = BABYLON.GUI.Button.CreateImageButton(
        `lockBadge_${i}`,
        "",
        iconToUse
      );
      lockBadge.fontSize = "14px";
      lockBadge.height = "60px";
      lockBadge.width = "60px";
      lockBadge.paddingLeft = "10px";
      lockBadge.paddingBottom = "10px";
      lockBadge.left = i * 50 + "px"; // Arrange horizontally
      lockBadge.cornerRadius = 8;
      lockBadge.thickness = 0;
      lockBadge.verticalAlignment =
        BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
      lockBadge.horizontalAlignment =
        BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      // Keep enabled to prevent grey disabled appearance
      lockBadge.isEnabled = true;
      lockBadge.isPointerBlocker = false; // Don't block pointer events

      // Center and scale the icon to fill the button
      lockBadge.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
      lockBadge.image.horizontalAlignment =
        BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      lockBadge.image.verticalAlignment =
        BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
      lockBadge.image.widthInPixels = 42;
      lockBadge.image.heightInPixels = 42;

      // Style based on unlock status
      if (isUnlocked) {
        // Unlocked - transparent background
        lockBadge.color = "transparent";
        lockBadge.background = "transparent";
        lockBadge.alpha = 0.8;
      } else {
        // Locked - transparent background with reduced opacity
        lockBadge.color = "transparent";
        lockBadge.background = "transparent";
        lockBadge.alpha = 0.5;
      }

      this.fullscreenUI.addControl(lockBadge);
      this.lockBadges.push(lockBadge);
    }
  }

  // Update lock counter badges when locks/unlocks change
  updateLockCounterBadges(scene) {
    // Remove existing badges
    for (const badge of this.lockBadges) {
      this.fullscreenUI.removeControl(badge);
    }
    this.lockBadges = [];

    // Recreate badges with updated counts
    if (MODE !== "arc" || !DEST) this.createLockCounterBadges(scene);
  }

  // Centralized function to update sound button icon
  updateSoundIcon(isMuted) {
    if (this.soundButton && this.soundButton.image) {
      if (isMuted) {
        // Special case: muted button always has white icon and purple background
        const whiteIcon = this.icons.muteWhite;
        this.soundButton.image.source = whiteIcon;
        this.soundButton.background = "#ff8efd"; // Purple background to match image
      } else {
        // Unmuted: use theme-appropriate icon and background
        this.soundButton.image.source = this.icons.unmuteWhite;
        this.soundButton.background = "#39e600";
      }
    }
  }

  // Centralized function to update next button icon based on enabled state
  updateNextButtonIcon(isEnabled = true) {
    if (this.nextButton && this.nextButton.image) {
      if (isEnabled) {
        // Enabled: always white icon regardless of theme
        this.nextButton.image.source = this.icons.nextWhite;
      } else {
        // Disabled: use theme-appropriate icon
        this.nextButton.image.source = this.icons.next;
      }
    }
  }

  // Create progress message element
  createProgressMessage() {
    var bgcolour = "rgba(255,255,255,0.8)";
    var textcolour = "#39e600";
    // Create message container
    this.progressMessage = new BABYLON.GUI.Rectangle("progressMessage");
    this.progressMessage.width = "250px";
    this.progressMessage.height = "120px";
    this.progressMessage.cornerRadius = 10;
    this.progressMessage.color = "black";
    this.progressMessage.thickness = 2;
    this.progressMessage.background = bgcolour;
    this.progressMessage.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.progressMessage.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.progressMessage.top = "50px";
    this.progressMessage.isVisible = false;

    // Create message text
    this.progressMessageText = new BABYLON.GUI.TextBlock("progressMessageText");
    this.progressMessageText.text = "";
    this.progressMessageText.color = "black";
    this.progressMessageText.fontSize = "18px";
    this.progressMessageText.fontFamily = this.fontName;
    this.progressMessageText.lineSpacing = "5px"; // Increased space between message lines
    this.progressMessage.addControl(this.progressMessageText);
    this.fullscreenUI.addControl(this.progressMessage);
  }

  // Show progress message with unlock status
  showProgressMessage(scene) {
    if (!this.progressMessage) return;

    const unlocks = scene.unlocks;
    const locks = scene.locks;
    let messageText;
    if (this.animateText) {
      clearInterval(this.interval);
      this.animateText = null;
    }
    this.animateText = (element, text) => {
      let index = 0;
      this.interval = setInterval(() => {
        element.text = text.substring(0, index);
        index++;
        if (index > text.length) {
          clearInterval(this.interval);
        }
      }, 50); // Adjust speed here (milliseconds)
    };

    if (unlocks === locks && locks > 0) {
      messageText = "";
      this.animateText(this.progressMessageText, this.scene.texts.completed);
    } else if (locks > 0) {
      const remainingLocks = locks - unlocks;
      this.animateText(
        this.progressMessageText,
        this.scene.texts.unlocked + remainingLocks
      );
    } else {
      return; // No locks, no message
    }

    // Hide message after 3 seconds
    this.progressMessageText.text = messageText;
    this.progressMessage.isVisible = true;
    setTimeout(() => {
      if (this.progressMessage) {
        this.progressMessage.isVisible = false;
      }
    }, 4000);
  }

  // Show share message when link is copied
  showShareMessage() {
    if (!this.progressMessage) return;

    this.progressMessageText.text = this.scene.texts.shareText;
    this.progressMessage.isVisible = true;

    // Hide message after 3 seconds
    setTimeout(() => {
      if (this.progressMessage) {
        this.progressMessage.isVisible = false;
      }
    }, 3000);
  }

  createAboutModalButtons(scene) {
    const bg = scene.style === "light" ? "#ffffff" : "#333333";
    const fg = scene.style === "light" ? "black" : "white";

    // Modal dim background layer (behind buttons)
    if (!this.modalOverlay) {
      this.modalOverlay = new BABYLON.GUI.Rectangle("aboutModalOverlay");
      this.modalOverlay.top = "-70px";
      this.modalOverlay.width = "250px";
      this.modalOverlay.height = "250px";
      this.modalOverlay.thickness = 1;
      this.modalOverlay.cornerRadius = 20;
      this.modalOverlay.color = "white";
      this.modalOverlay.background = "#000000";
      this.modalOverlay.alpha = 0.7; // semi-transparent
      this.modalOverlay.isVisible = false;
      this.modalOverlay.verticalAlignment =
        BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
      this.modalOverlay.horizontalAlignment =
        BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      this.modalOverlay.isPointerBlocker = true; // block clicks under the modal
      // Clicking the backdrop closes the modal
      this.modalOverlay.onPointerUpObservable.add(() => {
        this.toggleAboutModal(false);
      });
      // Add BEFORE buttons so buttons render above the overlay
      this.fullscreenUI.addControl(this.modalOverlay);
    }

    // Open About button
    this.openaboutButton = BABYLON.GUI.Button.CreateSimpleButton(
      "openaboutButton",
      scene.texts.aboutTextButton
    );
    this.openaboutButton.height = "60px";
    this.openaboutButton.width = "190px";
    this.openaboutButton.cornerRadius = 10;
    this.openaboutButton.thickness = 0;
    this.openaboutButton.background = "#ff8efd";
    this.openaboutButton.alpha = 0.95;
    this.openaboutButton.color = "black";
    this.openaboutButton.fontFamily = this.fontName;
    this.openaboutButton.textBlock.fontWeight = "bold";
    this.openaboutButton.fontSize = "18px";
    this.openaboutButton.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.openaboutButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.openaboutButton.top = "-140px";
    this.openaboutButton.isVisible = false;
    this.openaboutButton.scene = scene;
    this.openaboutButton.cursor = "pointer";
    this.openaboutButton.onPointerUpObservable.add(() => {
      // Use the same about link as the about button
      const link =
        this.aboutButton && this.aboutButton.link
          ? this.aboutButton.link
          : scene.texts
          ? scene.texts.aboutLink
          : null;
      if (link) {
        scene.openLink(link,"about");
      }
      this.toggleAboutModal(false);
    });
    this.fullscreenUI.addControl(this.openaboutButton);

    // Open Source button
    this.opensourceButton = BABYLON.GUI.Button.CreateSimpleButton(
      "opensourceButton",
      scene.texts.opensourceButton
    );
    this.opensourceButton.height = "60px";
    this.opensourceButton.width = "190px";
    this.opensourceButton.cornerRadius = 10;
    this.opensourceButton.thickness = 0;
    this.opensourceButton.background = "#ff8efd";
    this.opensourceButton.alpha = 0.95;
    this.opensourceButton.color = "black";
    this.opensourceButton.fontFamily = this.fontName;
    this.opensourceButton.textBlock.fontWeight = "bold";
    this.opensourceButton.fontSize = "18px";
    this.opensourceButton.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.opensourceButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.opensourceButton.top = "-70px";
    this.opensourceButton.isVisible = false;
    this.opensourceButton.scene = scene;
    this.opensourceButton.cursor = "pointer";
    this.opensourceButton.onPointerUpObservable.add(() => {
      // Navigate to the open-source link if available
      const link =
        scene.texts && scene.texts.opensourceLink
          ? scene.texts.opensourceLink
          : this.icons.openSource;
      scene.openLink(link,"opensource");
      this.toggleAboutModal(false);
    });
    this.fullscreenUI.addControl(this.opensourceButton);

    // Cancel button
    this.cancelButton = BABYLON.GUI.Button.CreateSimpleButton(
      "cancelButton",
      scene.texts.cancelButton
    );
    this.cancelButton.height = "60px";
    this.cancelButton.width = "190px";
    this.cancelButton.cornerRadius = 10;
    this.cancelButton.thickness = 0;
    this.cancelButton.background = "white";
    this.cancelButton.alpha = 0.95;
    this.cancelButton.color = "black";
    this.cancelButton.fontFamily = this.fontName;
    this.cancelButton.textBlock.fontWeight = "bold";
    this.cancelButton.fontSize = "18px";
    this.cancelButton.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.cancelButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.cancelButton.top = "0px";
    this.cancelButton.isVisible = false;
    this.cancelButton.scene = scene;
    this.cancelButton.cursor = "pointer";
    this.cancelButton.onPointerUpObservable.add(() => {
      this.toggleAboutModal(false);
    });
    this.fullscreenUI.addControl(this.cancelButton);
  }

  // Toggle visibility of the three centered about buttons
  toggleAboutModal(show) {
    let visible = false;
    if (show) visible = show;
    else visible = !this.opensourceButton.isVisible;
    if (this.opensourceButton) this.opensourceButton.isVisible = visible;
    if (this.openaboutButton) this.openaboutButton.isVisible = visible;
    if (this.cancelButton) this.cancelButton.isVisible = visible;
    if (this.modalOverlay) this.modalOverlay.isVisible = visible;
  }
  // Automated actions
  automatedActions() {
    // called before every frame
    var scene = this.scene;
    var immersionUI = this;
    scene.registerBeforeRender(function () {
      // Updates coordinates displayed in dvp mode
      if (MODE == "dvp")
        immersionUI.coordinatesDisplay.text =
          '"position": { "x": ' +
          scene.activeCamera.position.x.toFixed(1) +
          ', "y": ' +
          scene.activeCamera.position.y.toFixed(1) +
          ', "z": ' +
          scene.activeCamera.position.z.toFixed(1) +
          ' },\n"lookingAt": { "x": ' +
          scene.activeCamera.getTarget().x.toFixed(2) +
          ', "y": ' +
          scene.activeCamera.getTarget().y.toFixed(2) +
          ', "z": ' +
          scene.activeCamera.getTarget().z.toFixed(2) +
          "}";
    });
  }
}
