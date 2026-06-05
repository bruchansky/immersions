// Character — animated VRM character for Babylon.js scenes.
//
// Usage:
//   const char = new Character(scene, '/vrms/', 'model.vrm');
//   await char.load();
//   char.body('sitting').leftArm('bent').rightArm('forward').look('left').mouth('smiling');
//   char.startTalking();
//   char.stopTalking();
//   char.dispose();
//
// body():               'default' | 'sitting' | 'walking' (animated) | 'dancing' (animated) | 'flying' (animated)
// leftArm() / rightArm(): 'default' | 'up' | 'forward' | 'bent'
// look():               'default' | 'left' | 'right' | 'up' | 'down'
// mouth():              'default' | 'smiling' | 'open' | 'surprised'
// eyes():               'default' (auto-blink animated) | 'closed'
// startTalking():       animate mouth open/close at speech rhythm
// stopTalking():        stop talking animation, restore previous mouth pose

class Character {

  constructor(scene, rootUrl, filename) {
    this.scene   = scene;
    this.vrmPath = rootUrl + filename;
    this.mesh    = null;
    this.root    = null;  // root TransformNode — set position/rotation here
    this.expressions = [];
    this._boneCache  = {}; // cached node refs so two characters don't clash by name
    this._id         = 'char_' + Math.random().toString(36).slice(2, 7);

    this._time        = 0;
    this._bodyPos     = 'default';
    this._leftArmPos  = 'default';
    this._rightArmPos = 'default';
    this._headLookX   = 0; // current pitch in degrees
    this._headLookY   = 0; // current yaw in degrees

    // ── Bone coordinate system (Mixamo rig, Babylon.js, empirically verified) ──
    // rotation.copyFromFloats(x, y, z) on each bone; all values below in degrees.
    //
    // LEGS (LeftUpLeg / RightUpLeg / LeftLeg / RightLeg)
    //   x+  → thigh swings FORWARD;  x-  → thigh swings BACKWARD
    //   For sitting: UpLeg x=+80° (thighs fwd), Leg x=-80° (shins hang down)
    //
    // ARMS (LeftArm / RightArm) — default pose = T-pose (arms horizontal)
    //   z: up/down, MIRRORED — lz- raises left arm, lz+ lowers; rz+ raises right, rz- lowers
    //   y: fwd/back, MIRRORED — ly- swings left arm forward; ry+ swings right arm forward
    //   x: roll along arm length (minor wrist twist)
    //
    // FOREARM (LeftForeArm / RightForeArm)
    //   fy: swing forearm forward/back;  fx: elbow flex toward shoulder
    //
    // ROOT (parent of Hips)
    //   rotation.x = -90° → character lies flat (face up)
    //   position.y → vertical offset (0.9 when lying)
    // ──────────────────────────────────────────────────────────────────────────

    // All pose presets — values in degrees, converted to radians at runtime.
    this._presets = {
      // Arms: l=left, r=right; f prefix = forearm. Neutral (all 0) = T-pose.
      arms: {
        'default': { lz:  75, rz: -75 },
        'up':      { lz: -60, rz:  60, lfx: 90, rfx: 90 },
        'forward': { ly: -80, ry:  80, lz:  17, rz: -17 },
        'bent':    { lz:  70, rz: -70, lfy: -90, rfy:  90 },
      },
      // Body/legs: bone angles [x, y, z], rootX/rootY for lying
      body: {
        'default': {},
        'sitting': {
          leftUpLeg:  [ 80, 0,  6],
          rightUpLeg: [ 80, 0, -6],
          leftLeg:    [-80, 0,  0],
          rightLeg:   [-80, 0,  0],
          spine:      [  9, 0,  0],
        },
        'walking': { amp: 26 },
        'dancing': { amp: 18 },
        'flying':  {},
      },
      // Head look positions { x: pitch, y: yaw } in degrees
      head: {
        'default': { x:  0, y:  0 },
        'left':    { x:  0, y: 15 },
        'right':   { x:  0, y:-15 },
        'up':      { x: 25, y:  0 },
        'down':    { x:-25, y:  0 },
      },
      // Face expressions — map named poses to VRM blend shape names
      mouth: { 'default': 'E', 'smiling': 'neutral', 'open': 'A', 'surprised': 'U' },
      eyes:  { 'default': 'neutral', 'closed': 'Blink' },
    };

    this._mouthPos  = 'default';
    this._eyesPos   = 'default';
    this._blinking  = false;
    this._nextBlink = 3 + Math.random() * 3;
    this._blinkEnd  = 0;
    this._talking      = false;
    this._talkPhase    = false;
    this._savedMouthPos = null;

    this._observer = scene.onBeforeRenderObservable.add(() => this._tick());
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  dispose() {
    this.scene.onBeforeRenderObservable.remove(this._observer);
    if (this.mesh) this.mesh.dispose();
    if (this.root) this.root.dispose();
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  async load(rootUrl, filename) {
    return fetch(rootUrl && filename ? rootUrl + filename : this.vrmPath)
      .then(r => r.arrayBuffer())
      .then(buffer => {
        this.expressions = this._parseExpressions(buffer);
        const file = new File([buffer], this._id + '.glb', { type: 'model/gltf-binary' });

        // Snapshot existing nodes before loading so we can find the new ones
        const existingNodes   = new Set(this.scene.transformNodes.map(n => n.uniqueId));
        const existingMeshes  = new Set(this.scene.meshes.map(m => m.uniqueId));

        return new Promise((resolve, reject) => {
          BABYLON.SceneLoader.Append('file:', file, this.scene,
            () => {
              // Find newly added mesh with morph targets
              this.mesh = this.scene.meshes.find(
                m => !existingMeshes.has(m.uniqueId) && m.morphTargetManager
              );
              // Cache only the newly added transform nodes
              this.scene.transformNodes
                .filter(n => !existingNodes.has(n.uniqueId))
                .forEach(n => { this._boneCache[n.name] = n; });
              this.root = this._boneCache['mixamorig:Hips']?.parent || null;
              this.scene.meshes
                .filter(m => !existingMeshes.has(m.uniqueId))
                .forEach(m => { m.isPickable = false; });
              resolve(this);
            },
            null,
            (s, msg) => reject(new Error(msg))
          );
        });
      });
  }

  // ── Head direction ────────────────────────────────────────────────────────

  look(pos) {
    const p = this._presets.head[pos] || this._presets.head['default'];
    this._headLookX = p.x;
    this._headLookY = p.y;
    return this;
  }

  // ── Body position ─────────────────────────────────────────────────────────
  // options: 'default', 'sitting', 'walking', 'lying'

  body(pos) { this._bodyPos = pos; return this; }

  // ── Arm positions ─────────────────────────────────────────────────────────
  // options: 'default', 'up', 'forward', 'bent'

  leftArm(pos)  { this._leftArmPos  = pos; return this; }
  rightArm(pos) { this._rightArmPos = pos; return this; }

  // ── Expressions ───────────────────────────────────────────────────────────
  // mouth(): 'default' | 'smiling' | 'talking' | 'surprised'
  // eyes():  'default' | 'closed'

  mouth(pos) { this._mouthPos = pos; this._applyExpressions(); return this; }
  eyes(pos)  { this._eyesPos  = pos; this._applyExpressions(); return this; }

  startTalking() {
    this._savedMouthPos = this._mouthPos;
    this._talking = true;
    return this;
  }

  stopTalking() {
    this._talking = false;
    this._mouthPos = this._savedMouthPos || 'default';
    this._savedMouthPos = null;
    this._applyExpressions();
    return this;
  }

  _applyExpressions() {
    this.expressions.forEach(g => (g.binds || []).forEach(b => {
      const t = this.mesh?.morphTargetManager?.getTarget(b.index);
      if (t) t.influence = 0;
    }));
    this._applyExpr(this._presets.mouth[this._mouthPos]);
    this._applyExpr(this._blinking ? 'Blink' : this._presets.eyes[this._eyesPos]);
  }

  _applyExpr(name) {
    if (!name || name === 'neutral') return;
    const group = this.expressions.find(
      g => (g.name || g.presetName || '').toLowerCase() === name.toLowerCase()
    );
    if (group) (group.binds || []).forEach(b => {
      const t = this.mesh?.morphTargetManager?.getTarget(b.index);
      if (t) t.influence = (b.weight || 100) / 100;
    });
  }

  // ── Internal tick (runs every frame) ─────────────────────────────────────

  _tick() {
    this._time += this.scene.getEngine().getDeltaTime() * 0.001;
    const t = this._time;
    const d = deg => deg * Math.PI / 180;

    // Subtle breathing through spine
    const breathe = Math.sin(t * 0.7) * 0.04;
    this._setBone('mixamorig:Spine',  breathe, 0, 0);
    this._setBone('mixamorig:Spine1', breathe * 0.5, 0, 0);

    // Head: look target + gentle idle sway
    const headSwayY = Math.sin(t * 0.31) * 0.05;
    const headSwayX = Math.sin(t * 0.43) * 0.03;
    this._setBone('mixamorig:Head', d(this._headLookX) + headSwayX, d(this._headLookY) + headSwayY, 0);
    this._setBone('mixamorig:Neck', d(this._headLookX) * 0.3, d(this._headLookY) * 0.3 + headSwayY * 0.4, 0);

    // Auto-blink when eyes are open
    if (this._eyesPos === 'default') {
      if (!this._blinking && t >= this._nextBlink) {
        this._blinking = true;
        this._blinkEnd = t + 0.12;
        this._applyExpressions();
      } else if (this._blinking && t >= this._blinkEnd) {
        this._blinking = false;
        this._nextBlink = t + 2 + Math.random() * 4;
        this._applyExpressions();
      }
    }

    // Talking: toggle between 'open' and the saved mouth pose at speech rhythm
    if (this._talking) {
      const phase = Math.sin(t * 6) > 0;
      if (phase !== this._talkPhase) {
        this._talkPhase = phase;
        this._mouthPos  = phase ? 'open' : (this._savedMouthPos || 'default');
        this._applyExpressions();
      }
    }

    // Arms: preset position + subtle idle float (skipped when dancing handles arms directly)
    if (this._bodyPos !== 'dancing' && this._bodyPos !== 'flying') {
      this._tickArm('left',  t);
      this._tickArm('right', t);
    }


    // Reset all leg bones before applying current pose
    this._setBone('mixamorig:LeftUpLeg',  0, 0, 0);
    this._setBone('mixamorig:RightUpLeg', 0, 0, 0);
    this._setBone('mixamorig:LeftLeg',    0, 0, 0);
    this._setBone('mixamorig:RightLeg',   0, 0, 0);
    this._setBone('mixamorig:LeftFoot',   0, 0, 0);
    this._setBone('mixamorig:RightFoot',  0, 0, 0);

    if (this._bodyPos === 'walking') {
      const s = Math.sin(t * 3), amp = d(this._presets.body.walking.amp);
      this._setBone('mixamorig:LeftUpLeg',   amp * s,  0, 0);
      this._setBone('mixamorig:RightUpLeg',  amp * -s, 0, 0);
      this._setBone('mixamorig:LeftLeg',     Math.max(0, amp * 0.8 * -s), 0, 0);
      this._setBone('mixamorig:RightLeg',    Math.max(0, amp * 0.8 *  s), 0, 0);
      this._setBone('mixamorig:LeftFoot',    Math.max(0, amp * 0.3 *  s), 0, 0);
      this._setBone('mixamorig:RightFoot',   Math.max(0, amp * 0.3 * -s), 0, 0);
      this._setBone('mixamorig:Spine',       d(3), Math.sin(t * 3) * d(2), 0);

    } else if (this._bodyPos === 'sitting') {
      const p = this._presets.body.sitting;
      this._setBone('mixamorig:LeftUpLeg',   d(p.leftUpLeg[0]),  0,  d(p.leftUpLeg[2]));
      this._setBone('mixamorig:RightUpLeg',  d(p.rightUpLeg[0]), 0,  d(p.rightUpLeg[2]));
      this._setBone('mixamorig:LeftLeg',     d(p.leftLeg[0]),    0,  0);
      this._setBone('mixamorig:RightLeg',    d(p.rightLeg[0]),   0,  0);
      this._setBone('mixamorig:Spine',       d(p.spine[0]) + breathe, 0, 0);
      const tap = Math.sin(t * 0.8) * 0.05;
      this._setBone('mixamorig:LeftFoot',  tap, 0, 0);
      this._setBone('mixamorig:RightFoot', tap * 0.7, 0, 0);

    } else if (this._bodyPos === 'flying') {
      const s = Math.sin(t * 0.5);
      // Arms sweep from up to default
      this._setBone('mixamorig:LeftArm',      0, 0, d(7.5)  - d(30) * s);
      this._setBone('mixamorig:RightArm',     0, 0, d(-7.5) + d(30) * s);
      this._setBone('mixamorig:LeftForeArm',  d(90) * ((s + 1) / 2), 0, 0);
      this._setBone('mixamorig:RightForeArm', d(90) * ((s + 1) / 2), 0, 0);
      // Legs open
      this._setBone('mixamorig:LeftUpLeg',  0, 0, -d(15));
      this._setBone('mixamorig:RightUpLeg', 0, 0,  d(15));

    } else if (this._bodyPos === 'dancing') {
      const s = Math.sin(t * 4);
      const amp = d(this._presets.body.dancing.amp);
      this._setBone('mixamorig:LeftArm',      0, 0, d(70));
      this._setBone('mixamorig:RightArm',     0, 0, d(-70));
      this._setBone('mixamorig:LeftForeArm',  0, d(-90) + amp * s, 0);
      this._setBone('mixamorig:RightForeArm', 0,  d(90) + amp * s, 0);

    } else if (this._bodyPos === 'default') {
      const shift = Math.sin(t * 0.27) * 0.04;
      this._setBone('mixamorig:LeftUpLeg',  -shift * 0.2, 0, 0);
      this._setBone('mixamorig:RightUpLeg',  shift * 0.2, 0, 0);
      this._setBone('mixamorig:LeftLeg',     Math.abs(shift) * 0.1, 0, 0);
      this._setBone('mixamorig:RightLeg',    Math.abs(shift) * 0.1, 0, 0);
    }
  }

  _tickArm(side, t) {
    const isLeft   = side === 'left';
    const upperKey = isLeft ? 'mixamorig:LeftArm'     : 'mixamorig:RightArm';
    const lowerKey = isLeft ? 'mixamorig:LeftForeArm' : 'mixamorig:RightForeArm';

    const ac = window.armConfig;
    if (ac) {
      this._setBone(upperKey, ac.x ?? 0, ac.y ?? 0, ac.z ?? 0);
      this._setBone(lowerKey, ac.fx ?? 0, ac.fy ?? 0, ac.fz ?? 0);
      return;
    }

    const preset = this._presets.arms[isLeft ? this._leftArmPos : this._rightArmPos]
                || this._presets.arms['default'];
    const d = deg => deg * Math.PI / 180;
    const float  = Math.sin(t * 0.5 + (isLeft ? 0 : Math.PI * 0.7)) * 0.04;
    const x  = d((isLeft ? preset.lx  : preset.rx)  || 0);
    const y  = d((isLeft ? preset.ly  : preset.ry)  || 0);
    const z  = d((isLeft ? preset.lz  : preset.rz)  || 0) + float;
    const fx = d((isLeft ? preset.lfx : preset.rfx) || 0);
    const fy = d((isLeft ? preset.lfy : preset.rfy) || 0);
    const fz = d((isLeft ? preset.lfz : preset.rfz) || 0);
    this._setBone(upperKey, x, y, z);
    this._setBone(lowerKey, fx, fy, fz);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  _setBone(name, x, y, z) {
    const n = this._boneCache[name];
    if (!n) return;
    n.rotationQuaternion = null;
    n.rotation.copyFromFloats(x, y, z);
  }

  _parseExpressions(buffer) {
    try {
      const view   = new DataView(buffer);
      const len    = view.getUint32(12, true);
      const json   = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, len)));
      return json.extensions?.VRM?.blendShapeMaster?.blendShapeGroups || [];
    } catch (e) { return []; }
  }
}
