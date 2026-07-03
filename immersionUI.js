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
      next:
        this.style === "light"
          ? assetBasePath + "next.png"
          : assetBasePath + "next-w.png",
      previous: assetBasePath + "previous.png",
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
      aboutWhite: assetBasePath + "about-w.png",
      nextWhite: assetBasePath + "next-w.png",
      previousWhite: assetBasePath + "previous-w.png",
      recenterWhite: assetBasePath + "recenter-w.png",
      muteWhite: assetBasePath + "mute-w.png",
      unmuteWhite: assetBasePath + "unmute-w.png",
    };

    this.fullscreenUI =
      BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    if (MODE == "screenshot" || MODE == "cinematic") this.fullscreenUI.idealHeight = 1500;
    else if (window.innerHeight <= 500) this.fullscreenUI.idealHeight = 550;
    else this.fullscreenUI.idealHeight = 800;
    if (this.style == "light") var bgcolour = "white";
    else var bgcolour = "black";
    if (this.style == "light") var textcolour = "black";
    else var textcolour = "white";

    // sound button - handle initial mute status
    const initialMuted = MUTE === true;
    const initialIcon = initialMuted ? this.icons.muteWhite : this.icons.unmute;
    const initialBackground = initialMuted ? "#ff8efd" : bgcolour;

    var soundButton = BABYLON.GUI.Button.CreateImageButton(
      "soundButton",
      "",
      initialIcon
    );
    soundButton.fontSize = "14px";
    soundButton.height = "60px";
    soundButton.width = "80px";
    soundButton.paddingRight = "10px";
    soundButton.top = "130px";
    soundButton.cornerRadius = 10;
    soundButton.color = "transparent";
    soundButton.fontFamily = this.fontName;
    soundButton.thickness = 0;
    soundButton.background = initialBackground;
    soundButton.alpha = 1;
    soundButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    soundButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
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
    aboutButton.top = "70px";
    aboutButton.fontFamily = this.fontName;
    aboutButton.cornerRadius = 10;
    aboutButton.color = "transparent"; // No border
    aboutButton.thickness = 0;
    aboutButton.background = scene.style == "light" ? "#ffffff" : "#333333";
    aboutButton.alpha = 1.0;
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
    const aboutBg = scene.style == "light" ? "#ffffff" : "#333333";
    const aboutIcon = this.icons.about;
    aboutButton.onPointerEnterObservable.add(() => { aboutButton.background = "#39e600"; aboutButton.image.source = this.icons.aboutWhite; });
    aboutButton.onPointerOutObservable.add(() => { aboutButton.background = aboutBg; aboutButton.image.source = aboutIcon; });
    this.aboutButton = aboutButton; // Store reference for later updates
    aboutButton.onPointerUpObservable.add(function () {
      aboutButton.background = aboutBg; aboutButton.image.source = aboutIcon;
      aboutButton.scene.openLink(aboutButton.link, "about", true);
    });
    this.fullscreenUI.addControl(aboutButton);
    this.aboutButton = aboutButton;
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
    fullImmersionButton.background = scene.style == "light" ? "#ffffff" : "#333333";
    fullImmersionButton.alpha = 1.0;
    fullImmersionButton.verticalAlignment =
      BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    fullImmersionButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    fullImmersionButton.scene = scene;
    fullImmersionButton.textBlock.color = scene.style === "light" ? "black" : "white";
    fullImmersionButton.fontFamily = this.fontName;
    fullImmersionButton.color = "black";
    fullImmersionButton.thickness = 0;
    fullImmersionButton.link = scene.texts.fullLink;
    fullImmersionButton.cursor = "pointer"; // Show hand cursor on hover
    const fullBg = scene.style == "light" ? "#ffffff" : "#333333";
    const fullTextColor = scene.style === "light" ? "black" : "white";
    fullImmersionButton.onPointerEnterObservable.add(() => { fullImmersionButton.background = "#39e600"; fullImmersionButton.textBlock.color = "white"; });
    fullImmersionButton.onPointerOutObservable.add(() => { fullImmersionButton.background = fullBg; fullImmersionButton.textBlock.color = fullTextColor; });
    this.fullImmersionButton = fullImmersionButton; // Store reference for later updates
    fullImmersionButton.onPointerUpObservable.add(function () {
      fullImmersionButton.background = fullBg; fullImmersionButton.textBlock.color = fullTextColor;
      scene.openLink(fullImmersionButton.link, "play", true);
    });
    this.fullscreenUI.addControl(fullImmersionButton);
    this.fullImmersionButton = fullImmersionButton;
    this.fullImmersionButton.isVisible = false;

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
    exitButton.top = "10px";
    exitButton.fontFamily = this.fontName;
    exitButton.textBlock.fontWeight = "bold";
    exitButton.fontSize = "20px";
    exitButton.cornerRadius = 10;
    exitButton.color = scene.style == "dark" ? "#ffffff" : "#333333";
    exitButton.thickness = 0;
    exitButton.background = scene.style == "light" ? "#ffffff" : "#333333";
    exitButton.alpha = 1.0;
    exitButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    exitButton.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    exitButton.scene = scene;
    exitButton.cursor = "pointer"; // Show hand cursor on hover
    const exitBg = scene.style == "light" ? "#ffffff" : "#333333";
    const exitTextColor = scene.style == "dark" ? "#ffffff" : "#333333";
    exitButton.onPointerEnterObservable.add(() => { exitButton.background = "#39e600"; exitButton.color = "white"; });
    exitButton.onPointerOutObservable.add(() => { exitButton.background = exitBg; exitButton.color = exitTextColor; });
    this.exitButton = exitButton; // Store reference for later updates
    exitButton.onPointerUpObservable.add(function () {
      exitButton.background = exitBg; exitButton.color = exitTextColor;
      scene.openLink(scene.texts.exitLink, "exit", false);
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
      let phase = 0;
      const cycleMs = 1800;
      let lastTime = null;
      const pulse = (now) => {
        if (immersionUI._nextClicked || scene.inXR) {
          immersionUI._nextPulseRaf = null;
          nextButton.background = "#39e600";
          return;
        }
        if (lastTime !== null) phase += ((now - lastTime) / cycleMs) * (2 * Math.PI);
        lastTime = now;
        const t = (Math.sin(phase) + 1) / 2;
        nextButton.background = rgbToHex(lerpRgb(fromRgb, toRgb, t));
        immersionUI._nextPulseRaf = requestAnimationFrame(pulse);
      };
      immersionUI._nextPulseRaf = requestAnimationFrame(pulse);
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
      if (immersionUI._nextPulseRaf) {
        cancelAnimationFrame(immersionUI._nextPulseRaf);
        immersionUI._nextPulseRaf = null;
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
        nextButton.scene.immersionUI.setCurrentButtonActive(false);
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
    previousButton.onPointerEnterObservable.add(() => { previousButton.background = "#39e600"; previousButton.image.source = this.icons.previousWhite; });
    previousButton.onPointerOutObservable.add(() => { previousButton.background = "#ffffff"; previousButton.image.source = this.icons.previous; });
    previousButton.onPointerUpObservable.add(function () {
      previousButton.scene.unmuteAll();
      previousButton.scene.goPreviousStand();
      previousButton.scene.immersionUI.setCurrentButtonActive(false);
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
    currentButton.onPointerEnterObservable.add(() => { currentButton.background = "#39e600"; currentButton.image.source = this.icons.recenterWhite; });
    currentButton.onPointerOutObservable.add(() => { this.setCurrentButtonActive(currentButton.isEnabled); });
    currentButton.onPointerUpObservable.add(() => {
      currentButton.scene.unmuteAll();
      this.setCurrentButtonActive(false);
      currentButton.scene.currentStand().attachCamera(true, 12);
    });
    this.fullscreenUI.addControl(currentButton);
    this.currentButton = currentButton;
    this.setCurrentButtonActive(false);

    // Lock counter badges in upper left corner
    this.lockBadges = [];
    if (MODE !== "arc" || !DEST) this.createLockCounterBadges(scene);
    this.animateBadges();
    [soundButton, aboutButton, fullImmersionButton, exitButton, nextButton, previousButton, currentButton].forEach(b => this._addPressAnimation(b));

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
      exitButton.isVisible = false;
      currentButton.top = "-10px";
      currentButton.horizontalAlignment =
        BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    }
    if (MODE == "menu") {
      aboutButton.isVisible = false;
      fullImmersionButton.isVisible = true;
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
    if (MODE == "screenshot" || MODE == "cinematic") {
      soundButton.isVisible = false;
      currentButton.isVisible = false;
      fullImmersionButton.isVisible = false;
    }
    if (MODE == "cinematic") {
      previousButton.isVisible = false;
      nextButton.isVisible = false;
      aboutButton.isVisible = false;
      exitButton.isVisible = false;
    } else if (MODE == "menu") {
      soundButton.isVisible = false;
      fullImmersionButton.isVisible = false;
    }
    if (MODE == "cinematic" && SUBTITLES) {
      const subtitleColor = "white";
      if (!document.getElementById("cinematicSubtitleStyle")) {
        const style = document.createElement("style");
        style.id = "cinematicSubtitleStyle";
        style.textContent = "@media (max-width:768px){#cinematicSubtitle{font-size:4vw!important;bottom:200px!important;width:56%!important}}";
        document.head.appendChild(style);
      }
      const div = document.createElement("div");
      div.id = "cinematicSubtitle";
      div.style.cssText = [
        "position:fixed",
        "bottom:60px",
        "left:50%",
        "transform:translateX(-50%)",
        "width:70%",
        "text-align:center",
        "font-family:Tahoma,Georgia,sans-serif",
        "font-size:2.5vw",
        "font-weight:bold",
        `color:${subtitleColor}`,
        "text-shadow:0 0 6px rgba(0,0,0,0.9),0 0 12px rgba(0,0,0,0.7)",
        "line-height:1.4",
        "pointer-events:none",
        "z-index:10",
      ].join(";");
      div.textContent = "";
      div.style.visibility = "hidden";
      document.body.appendChild(div);
      this.cinematicSubtitle = div;
    }
  }

  // Create lock counter badges in bottom left corner
  createLockCounterBadges(scene) {
    if (MODE == "cinematic") return;
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

  setCurrentButtonActive(active) {
    this.currentButton.isEnabled = active;
    this.currentButton.background = active ? "#39e600" : "#ffffff";
    this.currentButton.image.source = active ? this.icons.recenterWhite : this.icons.recenter;
  }

  _addPressAnimation(btn) {
    btn.onPointerDownObservable.add(() => { btn.scaleX = 0.9; btn.scaleY = 0.9; });
    btn.onPointerUpObservable.add(() => { btn.scaleX = 1; btn.scaleY = 1; });
    btn.onPointerOutObservable.add(() => { btn.scaleX = 1; btn.scaleY = 1; });
  }

  animateBadges() {
    setInterval(() => {
      if (!this.lockBadges || this.lockBadges.length === 0) return;
      this.lockBadges.forEach((badge, i) => {
        setTimeout(() => {
          const duration = 300;
          const start = performance.now();
          const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const scale = 1 + 0.2 * Math.sin(t * Math.PI);
            badge.scaleX = scale;
            badge.scaleY = scale;
            if (t < 1) requestAnimationFrame(tick);
            else { badge.scaleX = 1; badge.scaleY = 1; }
          };
          requestAnimationFrame(tick);
        }, i * 150);
      });
    }, 5000);
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

  // Automated actions
  automatedActions() {
    // called before every frame
    var scene = this.scene;
    var immersionUI = this;
    var lastSubtitleIndex = -1;
    var pendingCinematicSetup = false;
    var cinematicGeneration = 0;
    if (MODE == "cinematic") scene.registerBeforeRender(function () {
      const idx = scene.currentStandIndex;
      if (idx !== lastSubtitleIndex) {
        lastSubtitleIndex = idx;
        cinematicGeneration++;
        if (immersionUI.cinematicSubtitle) immersionUI.cinematicSubtitle.style.visibility = "hidden";
        if (!scene.cameraMoving && scene.activeCamera.anim) {
          scene.activeCamera.anim.stop();
          scene.cameraRotating = null;
        }
        const stand = scene.currentStand();
        if (immersionUI.cinematicSubtitle) {
          let text = (stand && stand.description) ? stand.description : "";
          immersionUI.cinematicSubtitle.innerHTML = text.replace(/\n/g, "<br>");
        }
        pendingCinematicSetup = true;
      }
      if (pendingCinematicSetup && !scene.cameraMoving) {
        pendingCinematicSetup = false;
        const stand = scene.currentStand();
        const gen = cinematicGeneration;
        const hasNext = !scene.noMoreStands();
        if (DEST) {
          if (stand && (stand instanceof Plinth || (stand.durationInSec && stand.durationInSec >= 5))) {
            stand.startRotatingCamera();
          }
          setTimeout(function () {
            if (gen !== cinematicGeneration) return;
            if (immersionUI.cinematicSubtitle && stand && stand.subtitle) immersionUI.cinematicSubtitle.style.visibility = "visible";
          }, 500);
        } else {
          const duration = ((stand && stand.durationInSec != null) ? stand.durationInSec : 4) * 1000;
          if (stand && (stand instanceof Plinth || (stand.durationInSec && stand.durationInSec >= 5))) {
            stand.startRotatingCamera();
          }
          setTimeout(function () {
            if (gen !== cinematicGeneration) return;
            if (immersionUI.cinematicSubtitle && stand && stand.subtitle) immersionUI.cinematicSubtitle.style.visibility = "visible";
            setTimeout(function () {
              if (gen !== cinematicGeneration) return;
              if (immersionUI.cinematicSubtitle) immersionUI.cinematicSubtitle.style.visibility = "hidden";
              setTimeout(function () {
                if (gen !== cinematicGeneration) return;
                if (scene.activeCamera.anim) { scene.activeCamera.anim.stop(); scene.cameraRotating = null; }
                if (!hasNext) {
                  const link = scene.texts.exitLink;
                  const sep = link.includes("?") ? "&" : "?";
                  scene.openLink(link + sep + "mode=cinematic", "exit");
                } else {
                  scene.goNextStand();
                  scene.currentStand().attachCamera(true);
                }
              }, 500);
            }, Math.max(0, duration - 1000));
          }, 500);
        }
      }
    });
    if (MODE == "dvp") scene.registerBeforeRender(function () {
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
