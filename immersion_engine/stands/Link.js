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
 * Interactive link stands that open external URLs in new browser tabs.
 * Extends Teleporter with web navigation capabilities and VR-aware link handling.
 *
 * @class Link
 * @extends Teleporter
 * @since 0.1.0
 */
class Link extends Teleporter {
  /**
   * Creates a new Link instance.
   *
   * @param {string} name - The name identifier for this link
   * @param {Object} options - Configuration options extending Teleporter options
   * @param {string} [options.gate] - External URL to open when activated
   * @param {BABYLON.Scene} scene - The BabylonJS scene instance
   * @memberof Link
   */
  constructor(name, options, scene) {
    if (options.text == null) options.text = scene.texts.link;
    super(name, options, scene);
    //this.standSign.isPickable=true;
    this.standSign.material = scene.clickLinkMaterial;
    this.standMessage.color = "black";
    this.standSign.applyFog = false;
    this.standSign.hidingDistance = 15; // so that it cannot be clicked by nistake
    this.standSignText.hidingDistance = 15;
    //this.standSign._children[0].isVisible = false; //ball version
    //this.standSign._children[1].isVisible = false; //ball version
    //this.standSign._children[2].isVisible = false; //ball version
  }

  openLink() {
    if (this.gate && this.gate.includes("/")) {
      this.scene.openLink(this.gate,this.name) 
    }
  }
}
