/*
The Immersion library allows you to create immersive experiences
in virtual reality and on the Web.
Version 2.0, April 2022, using babylon.js 3D engine version 5.0.2.
Copyright (C) 2022  Christophe Bruchansky
https://bruchansky.name/immersions-vr-library

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

Please make sure to keep the "Open Source" button & VR stand in the user
interface so that other people can learn about the library.
Contact details and a list of all contributors are available on the 
project homepage (see link at the top).
*/

//////////////////////////////////////////////////////////////////////////////////////
//ENGINE//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
// Complidated things to make babylonjs and XR work
// Should be touched only for core engine functionalities
function launchImmersion(lang_p,dest_p,mode_p,mute_p,engine_path_p) {
    // initiate global variables (if not already set) ////////////////////////////////
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    window.DEVICE="desktop";
    window.LANG="en";
    window.MUTE=false;
    window.MODE="arc";
    window.DEST=null;
    window.ENGINE_PATH = "/immersion_engine/";
    if (mode_p) MODE=mode_p; else if (mode_p == null && urlParams.has('mode')) MODE = urlParams.get('mode'); 
    if (dest_p) DEST=dest_p; else if (dest_p == null && urlParams.has('dest')) DEST = urlParams.get('dest'); 
    if (mute_p) MUTE=mute_p; else if (mute_p == null && urlParams.has('mute')) MUTE = urlParams.get('mute'); 
    if (lang_p) LANG=lang_p; else if (lang_p == null && urlParams.has('lang')) LANG = urlParams.get('lang');  
    if (engine_path_p == null) window.ENGINE_PATH = "/immersion_engine/"; else window.ENGINE_PATH = engine_path_p;
    const ua = navigator.userAgent;
    const deviceType = () => {
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return "tablet";
        }
        else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return "mobile";
        }
        return "desktop";
    };
    DEVICE=deviceType();
    window.canvas = document.getElementById("renderCanvas");
    // Initiates the babylon engine //////////////////////////////////////////////////
    var sceneToRender = null;
    var createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };
    var initImmersion = async function () {
        var immersion = new MyImmersion(engine);
        try {
            immersion.xr = await immersion.createDefaultXRExperienceAsync({
                floorMeshes: [immersion.ground]
            });
            const xrTeleportation = immersion.xr.baseExperience.featuresManager.enableFeature(BABYLON.WebXRFeatureName.TELEPORTATION, "stable", {
                xrInput: immersion.xr.input,
                floorMeshes: [immersion.ground],
                defaultTargetMeshOptions: {
                    torusArrowMaterial: immersion.XRTeleportMaterial,
                    disableLighting: true,
                    snapToPositionRadius: 2
                },
            });
            immersion.addingSnapPoints(xrTeleportation);
            immersion.xr.baseExperience.sessionManager.onXRSessionInit.add(() => {
                immersion.updateXRNavigation();
                immersion.inXR=true;
                immersion.activeCamera.y=immersion.viewHeight;
            })
        } catch (e) {
        }
        return immersion;
    };
    window.initFunction = async function() {
        var asyncEngineCreation = async function() {
            try {
                return createDefaultEngine();
            } catch(e) {
                console.log("the available createEngine function failed. Creating the default engine instead");
                return createDefaultEngine();
            }
        };
        window.engine = await asyncEngineCreation();
        if (!engine) throw 'engine should not be null.';
        window.immersion = initImmersion();};
        initFunction().then(() => {immersion.then(returnedScene => { sceneToRender = returnedScene; });
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











//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//IMMERSION CLASS/////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
// Main class creating the immersion, UI, navigation, background sounds, etc
class Immersion extends BABYLON.Scene {
    constructor(name, style, engine) {
        super(engine);
        /* General settings */
        this.name=name;
        this.inXR=false; // tells if the immersion has entered the VR mode
        this.viewHeight=1.75; // default size of the user 
        this.style=style; // "light" or "dark" style of the immersion, used to adapt navigation colours
        var defaultOptionsScene = {
            createGround: false,
            skyboxSize : 500,
            sizeAuto: false,
            groundSize: 502,
            groundYBias: 0.01
            };
        this.env = this.createDefaultEnvironment(defaultOptionsScene);
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 502, height: 502}, this);
        this.ground.checkCollisions = true;
        this.ground.isPickable = false; 
        this.XRTeleportMaterial = new BABYLON.StandardMaterial("pointer");  
        this.XRTeleportMaterial.backFaceCulling = false;
        this.XRTeleportMaterial.diffuseColor = BABYLON.Color3.White();
        this.XRTeleportMaterial.emissiveColor = BABYLON.Color3.White();
        if (MUTE) this.mute=true; else this.mute=false;
        this.showTitleImmersion=true; // indicates if the title should appear on the sky after entering the immersion
        this.addDefaultText(); // sets all default text
        BABYLON.Engine.audioEngine.setGlobalVolume(1);
        if (MODE=="dvp") var axes = new BABYLON.AxesViewer(this,10); 
        this.sceneSounds= new Array();
        /* camera settings */
        if (MODE=="dvp") var camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0,0,0), this);
        else camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 0, new BABYLON.Vector3(0,0,0), this);
        camera.allowUpsideDown=false;
        camera.lowerRadiusLimit = 0.1;
        camera.attachControl(canvas, true);
        camera.minZ = 0.05;
        camera.angularSensibilityX = 4000;
        camera.angularSensibilityY = 4000;
        camera.wheelPrecision = 10;
        camera.pinchPrecision = 200;
        camera.speed = 0.1;
        camera.ellipsoid = new BABYLON.Vector3(0.05, this.viewHeight/2, 0.5);
        this.gravity = new BABYLON.Vector3(0, -0.9, 0);
        this.collisionsEnabled = true;
        camera.checkCollisions = true;
        camera.applyGravity = true;
        // sets boundaries to the scene
        var limit0 = BABYLON.MeshBuilder.CreatePlane("limit0", {height:502, width: 502});
        limit0.rotation.x  =  BABYLON.Tools.ToRadians(-90);
        limit0.position=new BABYLON.Vector3(0, 251, 0);
        limit0.isVisible=false;
        var limit1 = BABYLON.MeshBuilder.CreatePlane("limit1", {height:502, width: 502});
        limit1.position=new BABYLON.Vector3(0, 251, 251);
        limit1.isVisible=false;
        var limit2 = BABYLON.MeshBuilder.CreatePlane("limit2", {height:502, width: 502});
        limit2.rotation.y  =  BABYLON.Tools.ToRadians(-90);
        limit2.position=new BABYLON.Vector3(-251, 251, 0);
        limit2.isVisible=false;
        var limit3 = BABYLON.MeshBuilder.CreatePlane("limit3", {height:502, width: 502});
        limit3.rotation.y  =  BABYLON.Tools.ToRadians(180);
        limit3.position=new BABYLON.Vector3(0, 251, -251);
        limit3.isVisible=false;
        var limit4 = BABYLON.MeshBuilder.CreatePlane("limit4", {height:502, width: 502});
        limit4.rotation.y  =  BABYLON.Tools.ToRadians(90);
        limit4.position=new BABYLON.Vector3(251, 251, 0);
        limit4.isVisible=false;
        limit0.checkCollisions = true;
        limit1.checkCollisions = true;
        limit2.checkCollisions = true;
        limit3.checkCollisions = true;
        limit4.checkCollisions = true;
        /* asset management */
        // displays loading icon until the scene is fully loaded
        this.assetsManager = new BABYLON.AssetsManager(this);
        this.assetsManager.useDefaultLoadingScreen = false;
        BABYLON.SceneLoader.ShowLoadingScreen = false;
        var immersion = this;
        immersion.assetsManager.onFinish = function(tasks) {
            immersion.loadingButton.dispose();
            for (const stand of immersion.stands) {
                if (stand.name == "GATE_STAND") stand.stopLoading();
            }
            var result = new BABYLON.SceneOptimizerOptions(30, 2000);
            let priority = 0;
            result.optimizations.push(new BABYLON.ShadowsOptimization(priority));
            result.optimizations.push(new BABYLON.LensFlaresOptimization(priority));
            priority++;
            result.optimizations.push(new BABYLON.PostProcessesOptimization(priority));
            result.optimizations.push(new BABYLON.ParticlesOptimization(priority));
            priority++;
            result.optimizations.push(new BABYLON.TextureOptimization(priority, 256));
            priority++;
            result.optimizations.push(new BABYLON.RenderTargetsOptimization(priority));
            priority++;
            result.optimizations.push(new BABYLON.HardwareScalingOptimization(priority, 4));
            BABYLON.SceneOptimizer.OptimizeAsync(immersion, result,
                function() {
                   // On success
                }, function() {
                   // FPS target not reached 
            });  
        };
    }

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function that sets all default texts
    addDefaultText() {
        this.texts=new Object();
        if (LANG=='fr'){
            this.texts.aboutImmersionsButton="Open\nSource";
            this.texts.aboutImmersionsLink="https://bruchansky.name/immersions-vr-library";
            this.texts.aboutTextButton="À\npropos"; 
            this.texts.aboutLink="https://bruchansky.name"; 
            this.texts.exitTextButton="Art"; 
            this.texts.exitLink="https://immersions.art/fr"; 
            this.texts.inVR="- en VR et avec Audio -";
            this.texts.hold="Garder appuyé\net déplacer";
            this.texts.loading="Chargement";
            this.texts.loadingShort="Charge-\nment";
            this.texts.unmute="Remettre\nle son";
            this.texts.mute="Couper\nle son";
            this.texts.backPosition="Remise en\nposition";
            this.texts.viewpoint="Vue";
            this.texts.audio="Coin\nAudio";
            this.texts.text="Texte";
            this.texts.exhibit="Objet";
            this.texts.action="Inter-\naction"; 
            this.texts.gate="Porte";
            this.texts.art="Art";
            this.texts.vr="VR";
            this.texts.shop="Shop";
            this.texts.event="Expos";
            this.texts.start="Entrée";
            this.texts.welcome="Bienvenue";
            this.texts.pressHere="Appuyer\nIci";
            this.texts.shortInstr="Instru-\nctions";
            this.texts.instrTitle="Instructions";
            this.texts.instructions=`Cliquer sur les panneaux, suivant et précédent afin d'explorer.\n(1) Cliquer n'importe où et garder appuyé pour observer.\n(2) Utiliser 2 doigts ou la sourie pour zoomer`;
            this.texts.nextLinks='Suite';
            this.texts.instructionsVR="Se déplacer en cliquant sur les pannaux ou sur le sol, et puis relacher (voir schéma).";
            this.texts.enterLink="Appuyer\npour\nEntrer";
            this.texts.counterLink="Entrée\ndans ";
            this.texts.play="Écouter l'audio";
            this.texts.closeWindow="- Fermer l'écran pour continuer -";
            this.texts.pause="Arrêter l'audio";
            this.texts.title="Titre Immersion"; 
            this.texts.author="Auteur"; 
            this.texts.about="À propos de l'immersion"; 
        }else {
            this.texts.aboutImmersionsButton="Open\nSource";
            this.texts.aboutImmersionsLink="https://bruchansky.name/immersions-vr-library";
            this.texts.aboutTextButton="About"; 
            this.texts.aboutLink="https://bruchansky.name"; 
            this.texts.exitTextButton="Art"; 
            this.texts.exitLink="https://immersions.art/";
            this.texts.inVR="- In VR & with Audio -";
            this.texts.hold="Hold & move\naround";
            this.texts.loading="Loading";
            this.texts.loadingShort="Loading";
            this.texts.unmute="Unmute";
            this.texts.mute="Mute";
            this.texts.backPosition="Back to\nPosition";
            this.texts.viewpoint="View-\npoint";
            this.texts.audio="Audio\nStand";
            this.texts.text="Text\nDisplay";
            this.texts.exhibit="Exhibit";
            this.texts.action="Inter\naction"; 
            this.texts.gate="Gate";
            this.texts.art="Art";
            this.texts.vr="VR";
            this.texts.shop="Shop";
            this.texts.event="Event";
            this.texts.start="Start";
            this.texts.welcome="Welcome";
            this.texts.pressHere="Press Here";
            this.texts.shortInstr="Instru-\nctions";
            this.texts.instrTitle="Instructions";
            this.texts.instructions="Turn audio on. Click on displays, next & previous to explore.\n(1) Click anywhere on the screen and hold to look around.\n(2) Use your two fingers or mouse wheel to zoom in and out.";
            this.texts.nextLinks='Next';
            this.texts.instructionsVR="Move by selecting a display\n- or -\na position on the floor, then release\n(see image below).";
            this.texts.enterLink="Press\nto\nEnter";
            this.texts.counterLink="Enter\nin ";
            this.texts.play="Press to play";
            this.texts.closeWindow="- close screen to continue -";
            this.texts.pause="Stop Audio";
            this.texts.title="Immersion Title"; 
            this.texts.author="Author Name"; 
            this.texts.about="About this immersion"; 
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to add some text to your immersion
    addTexts(LANGuage,texts) {
        texts.aboutImmersionsButton=this.texts.aboutImmersionsButton;
        texts.aboutImmersionsLink=this.texts.aboutImmersionsLink;
        if (LANGuage==LANG) this.texts = {...this.texts,...texts};
    }
        
    //////////////////////////////////////////////////////////////////////////////////
    // immersion function  to change the sky and ground colours ("atmospheres")
    // setDefault = true to make this atmosphere the default one for your immersion
    setAtmosphere(envOptions, setDefault) {
        if (envOptions && setDefault==true) this.defaultEnvOptions=envOptions;
        else if (envOptions== null && this.defaultEnvOptions) envOptions=this.defaultEnvOptions;
        if (envOptions){
            if (envOptions.skyColor!==null && envOptions.skyColor) {
                this.env.skyboxMaterial.primaryColor = envOptions.skyColor;
                this.clearColor = envOptions.skyColor;
                this.ambientColor = envOptions.skyColor;
            }
            if (envOptions.groundMaterial!==null &&  envOptions.groundMaterial) this.ground.material = envOptions.groundMaterial;
            if (envOptions.fogDensity!==null && envOptions.fogDensity) {
                this.fogDensity = envOptions.fogDensity;
                if (envOptions.fogColor!==null && envOptions.fogColor) this.fogColor = envOptions.fogColor;
                if (this.fogDensity!==0) this.fogMode = BABYLON.Scene.FOGMODE_EXP;
            }
            if (envOptions.showTitleImmersion!==null && envOptions.showTitleImmersion!==undefined) this.showTitleImmersion = envOptions.showTitleImmersion;
        } 
    };
    
    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to play background sounds (if loaded and not on mute)
    playSounds () {
        this.sceneSounds.forEach(element => { 
            if (element.sound==null){
                var spatial=false;
                var distance=100;
                if (element.position) spatial= true;
                if (element.distance) distance = element.distance;
                let m = new BABYLON.Sound("music", element.data, this, null, {
                    loop: true,
                    autoplay: true,
                    maxDistance:distance,
                    spatialSound: spatial
                });
                if (element.position) m.setPosition(element.position);
                if (this.mute==true) BABYLON.Engine.audioEngine.setGlobalVolume(0);
                element.sound=m;
            }
        });
    }

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to add background sounds to your immersion
    addSound (music, position,distance) {
        var element = new Object();
        element.data=music;
        if (position) element.position=position; 
        if (distance) element.distance=distance;
        this.sceneSounds.push(element);
    }

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to play click sound (if loaded and not on mute)
    playClick () {
        if (this.click==null){
            this.click=new BABYLON.Sound("click", this.clickData, this, null, {
                loop: false,
                autoplay: true,
                spatialSound: false
            });
        }else this.click.play(0);
        if (this.mute==true) BABYLON.Engine.audioEngine.setGlobalVolume(0);
    }

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to display the title on your immersion sky
    showTitle () {
        if (this.titleIntro==null||this.titleIntro==undefined){
            if (this.titleImmersion!==null && this.titleImmersion!==undefined) this.titleImmersion.dispose();
            this.titleImmersion=null;
            if (this.artistImmersion!==null && this.artistImmersion!==undefined) this.artistImmersion.dispose();
            this.artistImmersion=null;
            if (this.showTitleImmersion==true && MODE!=="capture"){
                if (this.style=="light") var bgcolour="black"; else var bgcolour="white";
                if (this.style=="light") var textcolour="white"; else var textcolour="black";
                this.titleIntro = BABYLON.MeshBuilder.CreatePlane("titleIntro", {height:10, width: 20});
                this.titleIntro.applyFog=false;
                this.titleIntro.position=new BABYLON.Vector3(0, 27, 60);
                var titleMessage = new BABYLON.GUI.TextBlock();
                titleMessage.textWrapping=true;
                titleMessage.text = this.texts.title;
                titleMessage.color = bgcolour;
                titleMessage.fontSize = 40;
                titleMessage.width="400px";
                var titleTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.titleIntro,400,200);
                titleTexture.addControl(titleMessage);
                this.artistIntro = BABYLON.MeshBuilder.CreatePlane("artistIntro", {height:10, width: 20});
                this.artistIntro.applyFog=false;
                this.artistIntro.position=new BABYLON.Vector3(0, 22, 65);
                var artistnameMessage = new BABYLON.GUI.TextBlock();
                artistnameMessage.width="400px";
                artistnameMessage.textWrapping=true;
                artistnameMessage.text = this.texts.author;
                artistnameMessage.color = bgcolour;
                artistnameMessage.fontSize = 20;
                var artistnameTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.artistIntro,400,200);
                artistnameTexture.addControl(artistnameMessage);
            }
        }
    };

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to display the title on the sky when starting the immersion
    showTitleIntro () {
        if (this.titleImmersion==null||this.titleImmersion==undefined){
            if (this.titleIntro!==null && this.titleIntro!==undefined) this.titleIntro.dispose();
            this.titleIntro=null;
            if (this.artistIntro!==null && this.artistIntro!==undefined) this.artistIntro.dispose();
            this.artistIntro=null;
            if (this.style=="light") var bgcolour="black"; else var bgcolour="white";
            if (this.style=="light") var textcolour="white"; else var textcolour="black";
            this.titleImmersion = BABYLON.MeshBuilder.CreatePlane("titleImmersion", {height:10, width: 20});
            this.titleImmersion.applyFog=false;
            this.titleImmersion.position=new BABYLON.Vector3(0, 14, -135);
            var titleMessage = new BABYLON.GUI.TextBlock();
            titleMessage.width="400px";
            titleMessage.textWrapping=true;
            titleMessage.text = this.texts.title;
            titleMessage.color = bgcolour;
            titleMessage.fontSize = 40;
            var titleTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.titleImmersion,400,200);
            titleTexture.addControl(titleMessage);
            this.artistImmersion = BABYLON.MeshBuilder.CreatePlane("artistImmersion", {height:10, width: 20});
            this.artistImmersion.applyFog=false;
            this.artistImmersion.position=new BABYLON.Vector3(0, 9, -135);
            var artistnameMessage = new BABYLON.GUI.TextBlock();
            artistnameMessage.width="400px";
            artistnameMessage.textWrapping=true;
            artistnameMessage.text = this.texts.inVR+"\n\n"+this.texts.author;
            artistnameMessage.color = bgcolour;
            artistnameMessage.fontSize = 20;
            var artistnameTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.artistImmersion,400,200);
            artistnameTexture.addControl(artistnameMessage);
        }
    };

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to initiate stands and add introduction ones
    initiateStands(standsOptions) {
        this.stands = new Array();
        this.welcomeImage=standsOptions.welcomeImage;
        this.exitWebsite=standsOptions.exitWebsite;
        this.exitAtmosphere=standsOptions.exitAtmosphere;
        this.aboutTextButton=standsOptions.aboutTextButton;
        this.aboutLink=standsOptions.aboutLink;
        this.exitPosition=standsOptions.exitPosition;
        this.exitAngle=standsOptions.exitAngle;
        this.exitTextButton=standsOptions.exitTextButton;
        this.exitLink=standsOptions.exitLink;
        this.darkPlinthMaterial = new BABYLON.StandardMaterial(this); 
        this.darkPlinthMaterial.ambientColor = BABYLON.Color3.Black();
        this.darkPlinthMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        this.darkPlinthMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        this.lightPlinthMaterial = new BABYLON.StandardMaterial(this); 
        this.lightPlinthMaterial.diffuseColor = BABYLON.Color3.White();
        this.lightPlinthMaterial.ambientColor = BABYLON.Color3.White();
        this.wireframePlinthMaterial = new BABYLON.StandardMaterial(this); 
        this.wireframePlinthMaterial.wireframe = true;
        this.wireframePlinthMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.wireframePlinthMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
        this.selectionMaterial = new BABYLON.StandardMaterial(this); 
        this.selectionMaterial.ambientColor = BABYLON.Color3.White();
        this.selectionMaterial.diffuseColor = BABYLON.Color3.Black();
        this.selectionMaterial.specularColor = BABYLON.Color3.Green();
        this.selectionMaterial.emissiveColor = BABYLON.Color3.Black();
        this.selectionExitMaterial = new BABYLON.StandardMaterial(this); 
        this.selectionExitMaterial.ambientColor = BABYLON.Color3.Black();
        this.selectionExitMaterial.diffuseColor = new BABYLON.Color3(1, 0.490, 0.2);
        this.selectionExitMaterial.specularColor = new BABYLON.Color3(1, 0.490, 0.2);
        this.interfaceMaterial = new BABYLON.StandardMaterial(this); 
        this.interfaceMaterial.emissiveColor = BABYLON.Color3.Black();
        this.interfaceMaterial.disableLighting = true;
        // invisible wall to prevent moving backward when starting the immersion
        var protection = BABYLON.MeshBuilder.CreateBox("protection", {height: 5, width: 10, depth: 0.1});
        protection.position = new BABYLON.Vector3(0, 2.5, -181);
        protection.checkCollisions = true;
        protection.isVisible=false;
        var immersion=this;
        var loading_click = this.assetsManager.addBinaryFileTask("loading_click","/immersion_engine/click.mp3");
        loading_click.onSuccess = function(task) {
            immersion.clickData=task.data;
        };
        // empty stand where the user land when starting the immersion
        var OVERVIEW_STAND = new Stand ("OVERVIEW_STAND",{
            position: new BABYLON.Vector3(0,0,-175),
            lookingAt: new BABYLON.Vector3(0,2.18,-174),
            style:"light"
        },this);
        this.addStand(OVERVIEW_STAND);
        // first stand with welcome message
        var WELCOME_STAND = new Display ("WELCOME_STAND",{
            image:this.welcomeImage,
            windowOpened: true,
            title:this.texts.welcome,
            text:this.texts.pressHere,
            description: this.texts.about,
            position: new BABYLON.Vector3(0,0,-170),
            lookingAt: new BABYLON.Vector3(0,1.42,-169),
            style:"light"
        },this);
        this.addStand(WELCOME_STAND);
        // instructions stand
        var mvtImage = "/immersion_engine/move_tablet.png";
        if (DEVICE=='mobile'| DEVICE=='tablet') mvtImage = "/immersion_engine/move_tablet.png";
        var HOWTO_STAND = new Display ("HOWTO_STAND",{
            image:mvtImage,
            windowOpened: true,
            text: this.texts.shortInstr,
            title:this.texts.instrTitle,
            lineFrom:"WELCOME_STAND",
            description: this.texts.instructions,
            position: new BABYLON.Vector3(-1,0,-163),
            lookingAt: new BABYLON.Vector3(-0.85,1.45,-162.1),
            style:"light"
        },this);
        this.addStand(HOWTO_STAND);
        // "start" stand that is activated when all assets are loaded (see logic in the constructor and Gate class)
        var GATE_STAND = new Gate ("GATE_STAND",{
            gate: "_NEXT",
            lineFrom:"WELCOME_STAND",
            position: new BABYLON.Vector3(0,0,-157),
            lookingAt: new BABYLON.Vector3(0,1.75,-156),
            style:"light"
        },this);
        this.addStand(GATE_STAND);
    };
    
    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to add exit stands and activate the navigation
    activateNavigation() {
        var translation=this.exitPosition; // where exist stands are located
        var rotation=this.exitAngle; // exit stands can all be positioned with an angle
        let matrix = new BABYLON.Matrix();
        let rot = new BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, BABYLON.Tools.ToRadians(rotation));
        rot.toRotationMatrix(matrix);	 
        let position = new BABYLON.Vector3(0,0,0);
        let lookingAt = new BABYLON.Vector3(0,1.75,1);
        position=BABYLON.Vector3.TransformCoordinates(position,matrix).add(translation);
        lookingAt=BABYLON.Vector3.TransformCoordinates(lookingAt,matrix).add(translation);
        // "next" stand from where he user can see several links
        var END_STAND = new Stand ("END_STAND",{
            text:this.texts.nextLinks,
            description: this.about,
            position: position,
            lookingAt: lookingAt,
            style:"light",
            atmosphere:this.exitAtmosphere,
        },this);
        this.addStand(END_STAND);
        // custom link 
        position = new BABYLON.Vector3(-2,0,10);
        lookingAt = new BABYLON.Vector3(-2,1.75,11);
        position=BABYLON.Vector3.TransformCoordinates(position,matrix).add(translation);
        lookingAt=BABYLON.Vector3.TransformCoordinates(lookingAt,matrix).add(translation);
        var LINK_STAND = new Link ("LINK_STAND",{
            text: this.texts.exitTextButton,
            lineFrom: "end-choice",
            gate: this.texts.exitLink,
            position: position,
            lookingAt: lookingAt,
            style:"light",
            atmosphere:this.exitAtmosphere
        },this);
        this.addStand(LINK_STAND);
        // about link (also displayed in the menu)
        position = new BABYLON.Vector3(0,0,7);
        lookingAt = new BABYLON.Vector3(0,1.75,8);
        position=BABYLON.Vector3.TransformCoordinates(position,matrix).add(translation);
        lookingAt=BABYLON.Vector3.TransformCoordinates(lookingAt,matrix).add(translation);
        var ABOUT_THIS = new Link ("ABOUT_THIS",{
            gate: this.texts.aboutLink,
            text: this.texts.aboutTextButton,
            position: position,
            lineFrom: "end-choice",
            lookingAt: lookingAt,
            style:"light",
            atmosphere:this.exitAtmosphere
        },this);
        this.addStand(ABOUT_THIS);
        // open source link (also displayed in the menu)
        position = new BABYLON.Vector3(2,0,10);
        lookingAt = new BABYLON.Vector3(2,1.75,11);
        position=BABYLON.Vector3.TransformCoordinates(position,matrix).add(translation);
        lookingAt=BABYLON.Vector3.TransformCoordinates(lookingAt,matrix).add(translation);
        var ABOUT_IMMERSION = new Link ("ABOUT_IMMERSION",{
            gate: this.texts.aboutImmersionsLink,
            text: this.texts.aboutImmersionsButton,
            lineFrom: "end-choice",
            position: position,
            lookingAt: lookingAt,
            style:"light",
            atmosphere:this.exitAtmosphere
        },this);
        this.addStand(ABOUT_IMMERSION);
        // shows the UI, sets the first stand, attaches the camera and other init tasks
        this.showNavigation();
        this.goFirstStand();
        this.currentStand().attachCamera();
        this.automatedActions();
        if (MODE=="capture") {
            for (const s of this.stands) {
                if (s.name!=="WELCOME_STAND"){
                    s.standBase.isVisible=false;
                    if (s.standSign) s.standSign.isVisible=false;
                    if (s.standBox) s.standBox.isVisible=false;
                    if (s.standLines) s.standLines.isVisible=false;
                    if (s.plinth) s.plinth.isVisible=false;
                    if (s.plinthBase) s.plinthBase.isVisible=false;
                    if (s.soundLinkBack) s.soundLinkBack.isVisible=false;
                    if (s.soundButton) s.soundButton.isVisible=false;
                    if (s.soundLink) s.soundLink.isVisible=false;
                    if (s.actionLinkBack) s.actionLinkBack.isVisible=false;
                    if (s.actionButton) s.actionButton.isVisible=false;
                    if (s.actionLink) s.actionLink.isVisible=false;
                    if (s.standButton) s.standButton.isVisible=false;
                    if (s.soundBox) s.soundBox.isVisible=false;
                    if (s.soundBall) s.soundBall.isVisible=false;
                    if (s.standImage) s.standImage.isVisible=false;
                    if (s.image) s.image.isVisible=false;
                    if (s.captionPanel) s.captionPanel.isVisible=false;
                }
            }
        }
    };
    
    //////////////////////////////////////////////////////////////////////////////////
    // immersion functions to manage navigation between stands
    addStand (stand) {
        this.stands.push(stand);
    };
    goFirstStand(){
        if (DEST!==null && DEST){
            this.currentStandIndex=0;
            for (const s of this.stands) {
                if (s.name == DEST) this.currentStandIndex=this.stands.indexOf(s);
                if (this.introImage.isVisible==true) this.introImage.isVisible=false;
                if (this.introText.isVisible==true) this.introText.isVisible=false;
            }
        } else if (this.stands.length>0) {
            this.currentStandIndex=0;
        } 
    };
    goNextStand () {
        if (this.currentStandIndex==null) this.currentStandIndex = 0;
        else if (this.currentStandIndex<this.stands.length-1){
            for (let s = this.currentStandIndex+1; s < this.stands.length; s++) {
                if (!(this.stands[s] instanceof Link)) {
                    this.currentStandIndex=s;
                    break;
                }
            }
        }
    };
    nextStand () {
        if (this.currentStandIndex==null) return null;
        else if (this.currentStandIndex<this.stands.length-1){
            for (let s = this.currentStandIndex+1; s < this.stands.length; s++) {
                if (!(this.stands[s] instanceof Link)) {
                    return this.stands[s];
                    break;
                }
            }
        }
    };
    noMoreStands() { // tells if the current stand is the last one (not counting links)
        var lastStand=true;
        for (let s = this.currentStandIndex+1; s < this.stands.length; s++) {
            if (!(this.stands[s] instanceof Link)) {
                lastStand=false;
                break;
            }
        }
        return lastStand;
    };
    goPreviousStand () {
        if (this.currentStandIndex>0) {
            for (let s = this.currentStandIndex-1; s >= 0; s--) {
                if (!(this.stands[s] instanceof Link) && !(this.stands[s] instanceof Gate)) {
                    this.currentStandIndex=s;
                    break;
                }
            }
        } 
    };
    setCurrentStand (name){
        for (const stand of this.stands) {
            if (stand.name == name) this.currentStandIndex=this.stands.indexOf(stand);
        }
        this.currentButton.isVisible=false;
        if (this.currentStandIndex>0) {
            this.previousButton.isVisible=true;
        } else {
            this.previousButton.isVisible=false;
        }
        if (this.currentStandIndex<this.stands.length-1) {
            if (this.noMoreStands()){
                this.nextButton.isVisible=false;
            } else {
                this.nextButton.isVisible=true;
            }
        } else {
            this.nextButton.isVisible=false;
        }
        this.stands[this.currentStandIndex].attachCamera();
    };
    currentStand () {
        return this.stands[this.currentStandIndex];
    };
    findStandByName (name){
        if (this.stands!==null && this.stands){
            for (const stand of this.stands) {
                if (stand.name == name) return stand;
            }
        }
    };

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to set up automated behaviour
    automatedActions () {
        /* Detects click and pointer interactions */
        this.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh) {
                switch (pointerInfo.type) {
                    case BABYLON.PointerEventTypes.POINTERDOWN:
                    if(pointerInfo.pickInfo.hit) {
                        // in dvp mode, display mesh positions when clicked
                        var meshPosition = pointerInfo.pickInfo.pickedMesh.getAbsolutePosition();
                        if (MODE=="dvp") console.log(pointerInfo.pickInfo.pickedMesh.name+': x:'+meshPosition.x.toFixed(1)+',y:'+meshPosition.y.toFixed(1)+',z:'+meshPosition.z.toFixed(1));
                        // hides intro icon as soon the user moves around
                        if (this.introImage.isVisible==true) this.introImage.isVisible=false;
                        if (this.introText.isVisible==true) this.introText.isVisible=false;
                        // displays "back to position" as soon the user moves around
                        if (this.currentStandIndex>=0){
                            this.currentButton.isVisible=true;
                        }
                    }
                    break;
                }
            }
        }, BABYLON.PointerEventTypes.POINTERDOWN);
        // detects if any stand action should be triggered when pressing 'a'
        this.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case "a":
                        case "A":
                            if (this.currentStand().actionButton) this.currentStand().actionButton.stand.onChange.notifyObservers("pressed");
                        break
                    }
                break;
            }
        });
        // called before every frame
        var immersion=this;
        immersion.registerBeforeRender(function () {
            // updates all meshes having a calledOnEveryFrame function
            immersion.meshes.forEach(element => {
                if (element.calledOnEveryFrame) element.calledOnEveryFrame(immersion);
            });
            // updates coordinates displayed in dvp mode
            if (MODE=="dvp") immersion.coordinatesDisplay.text = 'x:'+immersion.activeCamera.position.x.toFixed(1)+',y:'+immersion.activeCamera.position.y.toFixed(1)+',z:'+immersion.activeCamera.position.z.toFixed(1)+',Looking at @x:'+immersion.activeCamera.getTarget().x.toFixed(2)+',@y:'+immersion.activeCamera.getTarget().y.toFixed(2)+',@z:'+immersion.activeCamera.getTarget().z.toFixed(2);
            // loads assets and displays loading animation until everything is loaded
            if (immersion.loadingButton && immersion.loadingButton!==null){
                if (immersion.loadingButton.counter==140) immersion.assetsManager.load();
                if (immersion.loadingButton.counter<=0) immersion.loadingButton.counter=121;
                immersion.loadingButton.counter--;
                if (immersion.loadingButton.counter==120 ) immersion.loadingButton.text=immersion.texts.loading;
                else if (immersion.loadingButton.counter==90 ) immersion.loadingButton.text=immersion.texts.loading+".";
                else if (immersion.loadingButton.counter==60 ) immersion.loadingButton.text=immersion.texts.loading+"..";
                else if (immersion.loadingButton.counter==30 ) immersion.loadingButton.text=immersion.texts.loading+"...";
            }
        });
    }
    
    //////////////////////////////////////////////////////////////////////////////////
    // immersion function that allows users to access stands in VR
    addingSnapPoints (xrTeleportation) {
        for (const stand of this.stands) {
            xrTeleportation.addSnapPoint(stand.position);
        }
    };

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function for things that need to be updated in VR mode
    updateXRNavigation() {
        this.fullscreenUI.dispose();
        for (const stand of this.stands) {
            if (stand.name == "HOWTO_STAND") {
                stand.image.isVisible=false;
                stand.imageTexture.addControl(new BABYLON.GUI.Image("image", "/immersion_engine/move_vr.png"), 0, 0);
                stand.description=this.texts.instructionsVR;
                stand.standWindowMessage.text="\n"+this.texts.instructionsVR;

            }
        }
    };

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to display the 2D navigation
    showNavigation () {
        this.fullscreenUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        if (MODE=="capture") this.fullscreenUI.idealHeight = 1200; else this.fullscreenUI.idealHeight = 850;
        if (this.style=="light") var bgcolour="black"; else var bgcolour="white";
        if (this.style=="light") var textcolour="white"; else var textcolour="black";
        var introText = new BABYLON.GUI.TextBlock();
        introText.text = this.texts.hold; 
        introText.color = bgcolour;
        introText.height = "80px";
        introText.width = "200px";
        introText.textWrapping=true;
        introText.lineSpacing = "5px";
        introText.fontSize = "13px";
        introText.paddingBottom="5px";
        introText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.introText=introText;
        if (this.style=="light") 
        var introImage = new BABYLON.GUI.Image("introImage", "/immersion_engine/move.png");
        else var introImage = new BABYLON.GUI.Image("introImage", "/immersion_engine/move_white.png");
        introImage.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        introImage.height = "190px";
        introImage.width = "60px";
        introImage.paddingBottom="130px";
        this.fullscreenUI.addControl(introText);   
        this.fullscreenUI.addControl(introImage);   
        this.introImage=introImage;
        // loading button
        var loadingButton = new BABYLON.GUI.TextBlock();
        loadingButton.text=this.texts.loading+"...";
        loadingButton.fontSize = "20px";
        loadingButton.height = "75px";
        loadingButton.width = "200px";
        loadingButton.cornerRadius = 10;
        loadingButton.paddingBottom="0px";
        loadingButton.paddingLeft="30px";
        loadingButton.color = bgcolour;
        loadingButton.thickness = 0;
        loadingButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        loadingButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        loadingButton.textHorizontalAlignment="left";
        loadingButton.isPickable=false;
        this.fullscreenUI.addControl(loadingButton);   
        var fullscreenUI = this.fullscreenUI;
        loadingButton.counter=160; // number used to initiate loading loop 
        if (this.name=='immersions') loadingButton.isVisible=false;
        this.loadingButton=loadingButton;
        let textsoundButton=this.texts.mute;
        if (MUTE) textsoundButton=this.texts.unmute;
        // sound button
        var soundButton = BABYLON.GUI.Button.CreateSimpleButton("soundButton", textsoundButton);
        soundButton.fontSize = "14px";
        soundButton.height = "60px";
        soundButton.width = "80px";
        soundButton.paddingRight = "10px";
        soundButton.paddingTop="10px";
        soundButton.cornerRadius = 10;
        soundButton.color = textcolour;
        soundButton.thickness = 0;
        soundButton.background = bgcolour;
        soundButton.alpha=0.8;
        soundButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        soundButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        soundButton.immersion=this;
        soundButton.onPointerUpObservable.add(function() {
            if (soundButton.immersion.mute==false) {
                BABYLON.Engine.audioEngine.setGlobalVolume(0);
                soundButton.textBlock.text=soundButton.immersion.texts.unmute;
                soundButton.immersion.mute=true;
            }
            else if (soundButton.immersion.mute==true) {
                soundButton.immersion.playSounds();
                soundButton.textBlock.text=soundButton.immersion.texts.mute;
                BABYLON.Engine.audioEngine.setGlobalVolume(1);
                soundButton.immersion.mute=false;
            }
        });
        this.fullscreenUI.addControl(soundButton);
        this.soundButton=soundButton; 
        // home button
        var homeButton = BABYLON.GUI.Button.CreateSimpleButton("homeButton", this.texts.aboutImmersionsButton);
        homeButton.fontSize = "14px";
        homeButton.height = "120px";
        homeButton.width = "80px";
        homeButton.paddingRight = "10px";
        homeButton.paddingTop="70px";
        homeButton.cornerRadius = 10;
        homeButton.color = textcolour;
        homeButton.thickness = 0;
        homeButton.background = bgcolour;
        homeButton.alpha=0.8;
        homeButton.link=this.texts.aboutImmersionsLink;
        homeButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        homeButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        homeButton.onPointerUpObservable.add(function() {
            BABYLON.Engine.audioEngine.setGlobalVolume(0);
            window.open(homeButton.link);
        });
        this.fullscreenUI.addControl(homeButton); 
        this.homeButton=homeButton;
        // about button
        var aboutButton = BABYLON.GUI.Button.CreateSimpleButton("aboutButton", this.texts.aboutTextButton);
        aboutButton.fontSize = "14px";
        aboutButton.height = "180px";
        aboutButton.width = "80px";
        aboutButton.paddingRight = "10px";
        aboutButton.paddingTop="130px";
        aboutButton.cornerRadius = 10;
        aboutButton.color = "black";
        aboutButton.thickness = 0;
        aboutButton.background = "yellow";
        aboutButton.link=this.texts.aboutLink;
        aboutButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        aboutButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        aboutButton.onPointerUpObservable.add(function() {
            BABYLON.Engine.audioEngine.setGlobalVolume(0);
            window.open(aboutButton.link)
        });
        this.fullscreenUI.addControl(aboutButton); 
        this.aboutButton=aboutButton;
        // next button
        if (this.style=="light") var nextImage= "/immersion_engine/up-white.png"; else var nextImage= "/immersion_engine/up-black.png";
        var nextButton = BABYLON.GUI.Button.CreateImageOnlyButton(
            "nextButton",
            nextImage
          );
        nextButton.fontSize = "13px";
        nextButton.height = "250px";
        nextButton.width = "80px";
        nextButton.paddingTop="190px";
        nextButton.paddingRight="10px";
        nextButton.cornerRadius = 10;
        nextButton.color = "white";
        nextButton.thickness = 0;
        nextButton.background = "green";
        nextButton.alpha=0.8;
        nextButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        nextButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        nextButton.isVisible=false;
        nextButton.immersion=this;
        nextButton.onPointerUpObservable.add(function() {
            nextButton.immersion.playSounds();
            if ((nextButton.immersion.stands[nextButton.immersion.currentStandIndex+1].name == "GATE_STAND") && (nextButton.immersion.stands[nextButton.immersion.currentStandIndex+1].standSign.isPickable==false)){
                // still loading 
            }else{
                nextButton.immersion.goNextStand();
                nextButton.immersion.currentButton.isVisible=false;
                nextButton.immersion.previousButton.isVisible=true;
                if (nextButton.immersion.currentStandIndex<nextButton.immersion.stands.length-1) {
                    if (nextButton.immersion.noMoreStands()){
                        nextButton.isVisible=false;
                    } else {
                        nextButton.isVisible=true;
                    }
                } else {
                    nextButton.isVisible=false;
                }
                nextButton.immersion.currentStand().attachCamera();
            }
        });
        this.fullscreenUI.addControl(nextButton);  
        this.nextButton=nextButton;
        // previous button
        if (this.style=="light") var previousImage= "/immersion_engine/down-white.png"; else var previousImage= "/immersion_engine/down-black.png";
        var previousButton = BABYLON.GUI.Button.CreateImageOnlyButton(
            "nextButton",
            previousImage
          );
        previousButton.fontSize = "13px";
        previousButton.height = "320px";
        previousButton.width = "80px";
        previousButton.paddingTop="260px";
        previousButton.paddingRight="10px";
        previousButton.cornerRadius = 10;
        previousButton.color = textcolour;
        previousButton.thickness = 0;
        previousButton.background = bgcolour;
        previousButton.alpha=0.8;
        previousButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        previousButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        previousButton.immersion=this;
        previousButton.onPointerUpObservable.add(function() {
            previousButton.immersion.playSounds();
            previousButton.immersion.goPreviousStand();
            previousButton.immersion.currentButton.isVisible=false;
            if (previousButton.immersion.currentStandIndex>0) {
                previousButton.isVisible=true;
            } else {
                previousButton.isVisible=false;
            }
            previousButton.immersion.nextButton.isVisible=true;
            
            previousButton.immersion.currentStand().attachCamera();
        });
        this.fullscreenUI.addControl(previousButton); 
        previousButton.isVisible=false;
        this.previousButton=previousButton;
        // current button ("back to position")
        var currentButton = BABYLON.GUI.Button.CreateSimpleButton("currentButton", this.texts.backPosition);
        currentButton.cornerRadius = 10;
        currentButton.color = "white";
        currentButton.thickness = 0; 
        currentButton.background = "green";
        currentButton.fontSize = "14px";
        currentButton.alpha=0.8;
        if (MODE=="capture") {
            currentButton.paddingLeft = "10px";
            currentButton.paddingTop="70px";
            currentButton.height = "120px";
            currentButton.width = "80px";
            currentButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            currentButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        } else{
            currentButton.height = "75px";
            currentButton.width = "90px";
            currentButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            currentButton.paddingBottom="20px";
        }
        currentButton.immersion=this;
        currentButton.onPointerUpObservable.add(function() {
            currentButton.immersion.playSounds(immersion);
            currentButton.isVisible=false;
            currentButton.immersion.currentStand().attachCamera();
        });
        this.fullscreenUI.addControl(currentButton);   
        currentButton.isVisible=false;
        this.currentButton=currentButton;
        // displays coordinates when in dvp mode
        if (MODE=="dvp") {
            if (this.style=="light") var colour="black"; else var colour="white";
            this.coordinatesDisplay = new BABYLON.GUI.TextBlock();
            this.coordinatesDisplay.text = "";
            this.coordinatesDisplay.color = colour;
            this.coordinatesDisplay.height = "20px";
            this.coordinatesDisplay.fontSize = "24px";
            this.fullscreenUI.addControl(this.coordinatesDisplay);   
            this.coordinatesDisplay.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        }
        // adds some extra navigation when in capture mode
        if (MODE=="capture") {
            var actionButton = BABYLON.GUI.Button.CreateSimpleButton("actionButton", this.texts.action);
            actionButton.paddingLeft = "10px";
            actionButton.paddingTop="10px";
            actionButton.height = "60px";
            actionButton.width = "80px";
            actionButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            actionButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            actionButton.fontSize = "14px";
            actionButton.cornerRadius = 10;
            actionButton.thickness = 0;
            actionButton.color = textcolour;
            actionButton.background = bgcolour;
            actionButton.link=this.texts.actionLink;
            var immersion=this;
            actionButton.onPointerUpObservable.add(function() {
                if (immersion.currentStand().actionButton) immersion.currentStand().actionButton.stand.onChange.notifyObservers("pressed");
            });
            this.fullscreenUI.addControl(actionButton); 
            this.actionButton=actionButton;
        }
    };
}












//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//STAND CLASS/////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
// Stands are navigation elements, they can be viewpoints, plinths, displays, etc.
class Stand extends BABYLON.TransformNode {
    
    constructor(name,options,immersion) {

        /* General stand properties */
        super(name);
        this.immersion=immersion;
        if (options.lineFrom!==null && options.lineFrom) this.lineFrom=options.lineFrom;
        if (options.position!==null && options.position) this.position=options.position;
        if (options.text!==null && options.text) this.text=options.text;
        if (options.atmosphere) this.atmosphere=options.atmosphere;
        if (options.style!==null && options.style) this.style=options.style; else this.style="light"; // only if sound
        if (options.lookingAt!==null) this.lookingAt=options.lookingAt; else this.lookingAt=new BABYLON.Vector3(0, 0, 0);
        if (this.style=="light") this.styleMaterial=immersion.lightPlinthMaterial; 
        else if (this.style=="wireframe") this.styleMaterial=immersion.wireframePlinthMaterial; 
        else this.styleMaterial=immersion.darkPlinthMaterial;
        if (this.style=="dark") this.oppositeMaterial=immersion.lightPlinthMaterial; else this.oppositeMaterial=immersion.darkPlinthMaterial; 

        // Positions the stand properly
        var angleDeg = Math.atan2(-this.position.x + this.lookingAt.x, -this.position.z + this.lookingAt.z) * 180 / Math.PI;
        this.rotation.y = BABYLON.Tools.ToRadians(angleDeg);
        this.position.y = 0.05;
        this.direction=this.lookingAt;

        // Creates the base of the stand 
        this.standBase = BABYLON.MeshBuilder.CreateCylinder("standBase", {radius: 0.5, height:0.1});
        this.standBase.applyFog=false;
        this.standBase.material = immersion.selectionMaterial;
        this.standBase.parent=this;

        // Highlights the stand base when pointed
        this.standBase.enableEdgesRendering(); 
        this.standBase.edgesColor = new BABYLON.Color4(1, 1, 1, 1);
        this.standBase.edgesWidth = 0;
        var standBase=this.standBase;
        standBase.stand=this;
        this.standBase.actionManager = new BABYLON.ActionManager(immersion);
        standBase.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){standBase.edgesWidth = 2;}));
        standBase.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(ev){standBase.edgesWidth = 0;}));
        standBase.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function(ev){immersion.setCurrentStand(standBase.stand.name);}));
            
        // Performs tasks when arriving on the stand
        standBase.standName=this.name;
        standBase.atmosphere=this.atmosphere;
        standBase.isActive=false;
        standBase.calledOnEveryFrame = (immersion) => {
            if (standBase.parent.position.subtract(immersion.activeCamera.position).length()<2.5 && standBase.isActive==false){
                if (immersion.inXR==true) immersion.setCurrentStand(standBase.stand.name); // in case the user moved to the stand without clicking anything (VR mode)
                standBase.isActive=true;
                standBase.stand.doWhenArriving();
            } else if (standBase.parent.position.subtract(immersion.activeCamera.position).length()>=2.5 && standBase.isActive==true ){
                standBase.isActive=false;
                standBase.stand.doWhenLeaving();
            }
        }
        
        // Draw lines between stands if specified
        if (this.lineFrom){ 
            let positionFrom = immersion.findStandByName(this.lineFrom);
            if (positionFrom){
                this.standPoints = [new BABYLON.Vector3(this.position.x,0,this.position.z),positionFrom.position];
                this.standLines = BABYLON.MeshBuilder.CreateLines("standLines", {points: this.standPoints});
                this.standLines.position.y=0.01;
                this.standLines.enableEdgesRendering(); 
                this.standLines.edgesWidth = 1.0;
                this.standLines.edgesColor = new BABYLON.Color4(this.styleMaterial.diffuseColor.r, this.styleMaterial.diffuseColor.g, this.styleMaterial.diffuseColor.b, 1);
                this.standLines.isPickable = false;  
            }
        }

        // text appearing on the base of stand 
        if (this.text){
            this.standSign = BABYLON.MeshBuilder.CreatePlane("standSign", {height:0.7, width: 0.7, sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
            this.standSign.parent=this;
            this.standSign.position=new BABYLON.Vector3(0, 0.45, 0);
            this.standBox= BABYLON.MeshBuilder.CreateBox("standBox", {height: 0.7, width: 0.7, depth: 0.04,sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
            this.standBox.parent=this.standSign;
            this.standBox.position=new BABYLON.Vector3(0, 0, 0.03);
            this.standBox.material=immersion.interfaceMaterial;
            this.standMessage = BABYLON.GUI.Button.CreateSimpleButton("standMessage", "");
            this.standMessage.thickness = 5;
            this.standMessage.textBlock.text = this.text;
            if (this.standMessage.textBlock.text.length>1) this.standMessage.fontSize = 55; else this.standMessage.fontSize = 150; // adapt text size 
            this.standMessage.height = "256px";
            this.standMessage.width = "256px";
            this.standMessage.textWrapping=true;
            this.standMessage.color = "white";
            this.standTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.standSign,256,256);
            this.standTexture.background = "black";
            this.standTexture.alpha = 0.1;
            this.standTexture.addControl(this.standMessage);

            // activate immersion sounds when first clicked on a stand
            var standMessage = this.standMessage;
            standMessage.immersion=immersion;
            
            standMessage.onPointerUpObservable.add(function() {
                standMessage.immersion.playSounds();
            });

            // Highlights sign when pointed
            this.standSign.actionManager = new BABYLON.ActionManager(this.immersion);
            this.standSign.enableEdgesRendering(); 
            this.standSign.edgesColor = new BABYLON.Color4(1,1,1, 1);
            this.standSign.edgesWidth = 0;
            var standSign=this.standSign;
            standSign.stand=this;
            standSign.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){standSign.edgesWidth = 2;}));
            standSign.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(ev){standSign.edgesWidth = 0;}));
            const action = standSign.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function(ev){immersion.setCurrentStand(standBase.stand.name);}));
            standSign.clickAction=action;
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // stand function to perform automated tasks when landing
    doWhenArriving(){
        this.immersion.setAtmosphere(this.standBase.atmosphere,false);
        if (this.immersion.currentStandIndex==0) this.immersion.showTitleIntro();else this.immersion.showTitle(); // shows or not immersion title
        if (this.standSign){
            this.standSign.isVisible=false;
            this.standBox.isVisible=false;
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // stand function to perform automated tasks when leaving 
    doWhenLeaving(){
        if (this.standSign && MODE!=="capture"){
            this.standSign.isVisible=true;
            this.standBox.isVisible=true;
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // stand function to move the camera when selected
    attachCamera(){
        this.immersion.activeCamera.position.x=this.position.x;
        this.immersion.activeCamera.position.z=this.position.z;
        this.immersion.activeCamera.position.y= this.immersion.viewHeight;
        if (this.immersion.inXR==false) {
            this.immersion.activeCamera.setTarget(this.lookingAt.clone());
            if (MODE!=="dvp") this.immersion.activeCamera.rebuildAnglesAndRadius();
        } 
    }
}








//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//GATE CLASS//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
// Gates are stands that teleport the user to another stand
class Gate extends Stand {
    constructor(name,options,immersion) {
        if (options.text===undefined) options.text=immersion.texts.gate; // Gates must always have a text
        super(name,options,immersion);
        if (options.gate) this.gate=options.gate;
        if (this.gate){
            // add particles to the gate so that it looks different from regular stands
            var particleSystem = new BABYLON.ParticleSystem("particles", 20);
            particleSystem.parent = this.standBase;
            particleSystem.emitter=this.standBase;
            particleSystem.minEmitBox = new BABYLON.Vector3(-0.3,0,-0.3);
            particleSystem.maxEmitBox = new BABYLON.Vector3(0.3,1,0.3);
            particleSystem.minSize = 0.05;
            particleSystem.maxSize = 0.1;
            particleSystem.updateSpeed = 0.05;
            this.standBase.material = immersion.selectionMaterial; 
            particleSystem.color1 = new BABYLON.Color4(immersion.selectionMaterial.specularColor.r, immersion.selectionMaterial.specularColor.g, immersion.selectionMaterial.specularColor.b, 1);
            particleSystem.color2 = new BABYLON.Color4(immersion.selectionMaterial.specularColor.r, immersion.selectionMaterial.specularColor.g, immersion.selectionMaterial.specularColor.b, 1);
            particleSystem.colordead = new BABYLON.Color4(1, 1, 1, 0);
            particleSystem.particleTexture = new BABYLON.Texture("/immersion_engine/flare.png");
            if (MODE!=="capture") particleSystem.start();
            // adds loading text if it is the immersion gate
            if (this.name == "GATE_STAND") {
                this.standSign.isPickable=false;
                this.standBase.isPickable=false;
                var standMessage = this.standMessage;
                this.standSign.counter=121;
                var standSign=this.standSign;
                standSign.standMessage=standMessage;
                standSign.calledOnEveryFrame = (immersion) => {
                    if (standSign.counter<=0) standSign.counter=121;
                    standSign.counter--;
                    if (standSign.counter==120 ) standSign.standMessage.textBlock.text=immersion.texts.loadingShort+"\n";
                    else if (standSign.counter==90 ) standSign.standMessage.textBlock.text=immersion.texts.loadingShort+"\n.";
                    else if (standSign.counter==60 ) standSign.standMessage.textBlock.text=immersion.texts.loadingShort+"\n..";
                    else if (standSign.counter==30 ) standSign.standMessage.textBlock.text=immersion.texts.loadingShort+"\n...";
                };
            }else this.activateGate();
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // gate function to activate a gate when the scene is loaded
    // (only used for the GATE_STAND)
    stopLoading(){
        var immersion=this.immersion;
        this.standMessage.textBlock.text=immersion.texts.start;
        this.standSign.isPickable=true;
        this.standBase.isPickable=true;
        this.activateGate();
    }

    //////////////////////////////////////////////////////////////////////////////////
    // gate function that teleports the user
    activateGate(){
        var immersion=this.immersion;
        var standSign=this.standSign;
        standSign.gateName=this.gate;
        standSign.calledOnEveryFrame = (immersion) => {
            if (standSign.parent.position.subtract(immersion.activeCamera.position).length()<2.5 && immersion.currentStand!==this){
                if (standSign.gateName=="_NEXT") standSign.gateName=immersion.nextStand().name; 
                immersion.setCurrentStand(standSign.gateName);
                this.doWhenArriving();
            } else if (standSign.parent.position.subtract(immersion.activeCamera.position).length()>=2.5 )this.doWhenLeaving();
        }
    }
}










//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//LINK CLASS//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
// Links are gates that open external links
// They quit the VR mode so that the user can see the new tab 
// A counter is used to avoid users clicking on links by mistake
class Link extends Gate {
    constructor(name,options,immersion) {
        super(name,options,immersion)
        if (this.gate && this.gate.includes('/')){
            this.standBase.material = immersion.selectionExitMaterial; 
            var standMessage = this.standMessage;
            standMessage.gate=this.gate;
            standMessage.immersion=this.immersion;
            standMessage.panel=this.standSign;
            standMessage.defaultText=this.text;
            /* initiates Sign counter */
            this.standSign.counter=400;
            this.standSign.standMessage=standMessage;
            this.standBase.isPickable=false;
            this.standSign.standMessage.canWork=false;
            this.standSign.material.emissiveColor=new BABYLON.Color3(0, 0.458, 0.070);
            /* countdown before being able to click */
            var standSign=this.standSign;
            standSign.actionManager.unregisterAction(standSign.clickAction);
            standSign.calledOnEveryFrame = (immersion) => {
                if (standSign.counter<=0){
                    standSign.standMessage.textBlock.text=immersion.texts.enterLink;
                    standSign.standMessage.canWork=true;
                    standSign.material.emissiveColor=new BABYLON.Color3(0, 0.458, 0.070);
                }else if (standSign.counter<300){
                    standSign.material.emissiveColor=new BABYLON.Color3(0, 0.458, 0.070);
                    standSign.counter--;
                    if (standSign.counter==90 ) standSign.standMessage.textBlock.text=immersion.texts.counterLink+"3";
                    else if (standSign.counter==60 ) standSign.standMessage.textBlock.text=immersion.texts.counterLink+"2";
                    else if (standSign.counter==30 ) standSign.standMessage.textBlock.text=immersion.texts.counterLink+"1";
                }
            };
            standSign.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){
                if (standSign.counter>95) standSign.counter=95;

            }));
            standSign.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(ev){
                standSign.counter=400;
                standSign.material.emissiveColor=new BABYLON.Color3(0, 0.458, 0.070);
                standSign.standMessage.textBlock.text=standSign.standMessage.defaultText;
                standSign.standMessage.canWork=false;
            }));
            /* clicks on the sign */
            standMessage.onPointerUpObservable.add(function() {
                if (standMessage.canWork==true){
                    BABYLON.Engine.audioEngine.setGlobalVolume(0);
                    standMessage.panel.counter=400;
                    standMessage.panel.material.emissiveColor=BABYLON.Color3.Black();
                    standMessage.textBlock.text=standSign.standMessage.defaultText;
                    standMessage.canWork=false;
                    window.open(standMessage.gate);
                    /* temporary solution */
                    if (standMessage.immersion.xr && standMessage.immersion.xr.baseExperience.state === BABYLON.WebXRState.IN_XR) {
                        standMessage.immersion.xr.baseExperience.exitXRAsync();
                    }
                    /* end temporary solution */
                }
            });
        }
    }
}






//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//DISPLAY CLASS///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
// Displays are stands with assets like images, texts and audios
class Display extends Stand {
    constructor(name,options,immersion) {
        super(name,options,immersion)
        if (options.title) this.title=options.title; // appears in the stand window
        if (options.description) this.description=options.description; // appears in the stand window
        if (options.windowOpened && MODE!=="capture") this.windowOpened=options.windowOpened;
        if (options.image!==null && options.image) this.imageURL=options.image;
        if (options.action) this.action=options.action 
        if (options.sound!==null && options.sound) this.sound=options.sound; // only if sound
        if (options.loop!==null && options.loop) this.loop=options.loop; else this.loop=false; // only if sound
        if (options.factorSound!==null && options.factorSound) this.factorSound=options.factorSound; else this.factorSound=0.8; // only if sound
        if (options.height!==null && options.height) this.height=options.height; else this.height=1.35; // default display height
        if (options.distance!==null && options.distance) this.distance=options.distance; else this.distance = 1; // distance from the base
        if (options.width!==null && options.width) this.width=options.width;
        else if (this.width==null && options.image==null) this.width=0.3;
        else this.width=0.4; // displays with images are a bit wider by default 
        if (options.depth!==null && options.depth) this.depth=options.depth;
        else this.depth=0.1;
        if (options.orientationLeft) this.orientationLeft=options.orientationLeft; // displays can be slightly on the left or right
        if (options.orientationRight) this.orientationRight=options.orientationRight;
        if (options.caption!==null && options.caption) this.caption=options.caption;
        // creates the plinth (main physical part of the display)
        this.plinth= BABYLON.MeshBuilder.CreateBox("plinth", {height: this.height, width: this.width, depth: this.depth});
        this.plinth.parent=this;
        this.plinth.position = new BABYLON.Vector3(0, this.height/2-0.05, this.distance);
        this.plinth.isPickable=false;
        this.plinth.material = this.styleMaterial;
        if (this.orientationRight) {
            this.plinth.position.x=this.plinth.position.x+this.orientationRight;
        } else if (this.orientationLeft) {
            this.plinth.position.x=this.plinth.position.x-this.orientationLeft;
        } 
        // creates the base of the display
        const myShape = [
            new BABYLON.Vector3(0, 0,0),
            new BABYLON.Vector3(0, 0,0.4),
            new BABYLON.Vector3(-0.4, 0,0.4),
            new BABYLON.Vector3(-0.06,0,0)
        ];
        this.plinthBase= BABYLON.MeshBuilder.ExtrudePolygon("plinthBase", {shape: myShape, depth: this.width}, immersion);
        this.plinthBase.parent=this.plinth;
        this.plinthBase.isPickable=false;
        this.plinthBase.rotation.z=BABYLON.Tools.ToRadians(-90);
        this.plinthBase.position = new BABYLON.Vector3(this.width/2, -this.height/2, -0.35);
        this.plinthBase.material = this.styleMaterial;
        // adds caption if any (sticker on the top left of the display)
        if (this.caption){
            this.captionPanel = BABYLON.MeshBuilder.CreatePlane("captionPanel", {height:0.06, width: 0.18, sidedirection: BABYLON.Mesh.DOUBLESIDE});
            this.captionPanel.parent=this.plinth;
            this.captionPanel.position=new BABYLON.Vector3(-this.width/2+0.11, this.height/2-0.05, -this.depth/2-0.005);
            this.captionMessage = new BABYLON.GUI.TextBlock();
            this.captionMessage.text = this.caption;
            this.captionPanel.material=immersion.interfaceMaterial;
            this.captionMessage.color = "black";
            this.captionMessage.fontSize = 35;
            this.captionTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.captionPanel,360,120);
            this.captionTexture.background="white";
            this.captionTexture.alpha = 1;
            this.captionTexture.addControl(this.captionMessage);
        }
        // adds button to start sound file if any (see demo file) 
        if (this.sound){
            this.soundLinkBack = BABYLON.MeshBuilder.CreateBox("soundBack", {height:0.06,width:0.18,depth:0.02});
            this.soundLinkBack.parent = this.plinth;
            this.soundLinkBack.material=this.styleMaterial;
            this.soundLinkBack.position=new BABYLON.Vector3(-this.width/2+0.11, this.height/2-0.05,-this.depth/2-0.001);
            this.soundLink = BABYLON.MeshBuilder.CreatePlane("soundButton", {height:0.06, width: 0.18, sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
            this.soundLink.parent = this.plinth;
            this.soundLink.position=new BABYLON.Vector3(-this.width/2+0.11, this.height/2-0.05,-this.depth/2-0.012);
            this.soundLinkTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.soundLink,360,120);
            this.soundLinkTexture.background = "black";
            this.soundButton = BABYLON.GUI.Button.CreateSimpleButton("standWindowButton", "");
            this.soundButton.fontSize = 35;
            this.soundButton.height = "120px";
            this.soundButton.width = "360px";
            this.soundButton.cornerRadius = 0;
            this.soundButton.color = "white";
            this.soundButton.thickness = 5;
            this.soundButton.background = "black";
            this.soundButton.textBlock.text=immersion.texts.play;
            this.soundButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            this.soundLinkTexture.addControl(this.soundButton);
            var soundLink=this.soundLink;
            soundLink.actionManager = new BABYLON.ActionManager(immersion);
            soundLink.enableEdgesRendering(); 
            soundLink.edgesColor = new BABYLON.Color4(1,1,1, 1);
            soundLink.edgesWidth = 0;
            soundLink.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){soundLink.edgesWidth = 0.2;}));
            soundLink.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(ev){soundLink.edgesWidth = 0;}));
            this.soundButton.onPointerUpObservable.add(function() {
                immersion.currentStand().pressSoundButton();
            });
        }
        // adds a button for any action if configured (see demo file) 
        if (this.action){
            this.onChange = new BABYLON.Observable();
            this.actionLinkBack = BABYLON.MeshBuilder.CreateBox("actionBack", {height:0.06,width:0.18,depth:0.02});
            this.actionLinkBack.parent = this.plinth;
            this.actionLinkBack.material=this.styleMaterial;
            this.actionLinkBack.position=new BABYLON.Vector3(-this.width/2+0.11, this.height/2-0.05,-this.depth/2-0.001);
            this.actionLink = BABYLON.MeshBuilder.CreatePlane("actionButton", {height:0.06, width: 0.18, sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
            this.actionLink.parent = this.plinth;
            this.actionLink.position=new BABYLON.Vector3(-this.width/2+0.11, this.height/2-0.05,-this.depth/2-0.012);
            this.actionLinkTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.actionLink,360,120);
            this.actionLinkTexture.background = "black";
            this.actionButton = BABYLON.GUI.Button.CreateSimpleButton("standWindowButton", "");
            this.actionButton.fontSize = 35;
            this.actionButton.height = "120px";
            this.actionButton.width = "360px";
            this.actionButton.cornerRadius = 0;
            this.actionButton.color = "white";
            this.actionButton.thickness = 5;
            this.actionButton.background = "black";
            this.actionButton.textBlock.text=this.action;
            this.actionButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            this.actionLinkTexture.addControl(this.actionButton);
            var actionLink=this.actionLink;
            this.actionButton.stand=this;
            var actionButton=this.actionButton;
            actionLink.actionManager = new BABYLON.ActionManager(immersion);
            actionLink.enableEdgesRendering(); 
            actionLink.edgesColor = new BABYLON.Color4(1,1,1, 1);
            actionLink.edgesWidth = 0;
            actionLink.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){actionLink.edgesWidth = 0.2;}));
            actionLink.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(ev){actionLink.edgesWidth = 0;}));
            actionButton.onPointerUpObservable.add(function() {
                immersion.playClick();
                actionButton.stand.onChange.notifyObservers("pressed");
            });
        }
        /* adds button to open window if configured (see demo file) */
        if (this.description){
            this.standButton= BABYLON.MeshBuilder.CreatePlane("standButton", {height:0.04, width: 0.04, sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
            this.standButton.actionManager = new BABYLON.ActionManager(immersion);
            this.standButton.enableEdgesRendering(); 
            this.standButton.edgesColor = new BABYLON.Color4(1,1,1, 1);
            this.standButton.edgesWidth = 0;
            this.standButton.parent=this.plinth;
            this.standButton.position=new BABYLON.Vector3(this.width/2-0.05, this.height/2-0.05, -this.depth/2-0.005);
            var buttonMaterial = new BABYLON.StandardMaterial(immersion); 
            buttonMaterial.emissiveColor=immersion.selectionMaterial.specularColor;
            buttonMaterial.disableLighting = true;
            this.standButton.material=buttonMaterial;
            this.buttonTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.standButton,57,57);
            this.imageButton = new BABYLON.GUI.Image("imageButton", "/immersion_engine/info-black.png");
            this.buttonTexture.addControl(this.imageButton, 0, 0);
            if (this.windowOpened && this.windowOpened==true) this.windowSwitch();
            var standButton=this.standButton;
            standButton.stand=this;
            standButton.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){standButton.material.emissiveColor=BABYLON.Color3.Green();immersion.stopAnimation(standButton);}));
            standButton.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(ev){immersion.beginAnimation(standButton, 0, 100, true);}));
            standButton.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function(ev){
                immersion.playClick();
                standButton.stand.windowSwitch();
            }));
            this.standButton.counter=0;
            const lightAnim = new BABYLON.Animation("lightAnim", "material.emissiveColor", 40, BABYLON.Animation.ANIMATIONTYPE_COLOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            const lightKeys = []; 
            lightKeys.push({frame: 0,value: immersion.selectionMaterial.specularColor});
            lightKeys.push({frame: 10,value: this.oppositeMaterial.diffuseColor});
            lightKeys.push({frame: 80,value: this.oppositeMaterial.diffuseColor});
            lightKeys.push({frame: 90,value:  immersion.selectionMaterial.specularColor});
            lightKeys.push({frame: 100,value:  immersion.selectionMaterial.specularColor});
            lightAnim.setKeys(lightKeys);
            this.standButton.animations = [];
            this.standButton.animations.push(lightAnim);
            immersion.beginAnimation(this.standButton, 0, 100, true);
        }
        // adds an image on the plinth if any (see demo file) 
        if (this.imageURL){
            this.standImage = BABYLON.MeshBuilder.CreatePlane("standImage", {height:(this.width-0.04)/3*2 , width: this.width-0.04, sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
            this.standImage.parent=this.plinth;
            this.standImage.isPickable=false;
            this.standImage.position=new BABYLON.Vector3(0, (this.height/2)-(this.width-0.04)/3-0.1, -this.depth/2-0.005);
            this.imageTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.standImage,500,375);
            this.image = new BABYLON.GUI.Image("image", this.imageURL);
            this.image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
            this.imageTexture.addControl(this.image, 0, 0);
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // display function to make the stand window appear 
    windowSwitch () {
        if(this.standWindow==null || !this.standWindow) {
            let positionCenter=0;
            if (this.width>0.5) positionCenter=(-0.15+this.width/2);
            let positionFront=0.15;
            if (this.depth>=0.3) positionFront=(this.depth/2);
            this.buttonTexture.removeControl(this.imageButton);
            this.imageButton = new BABYLON.GUI.Image("imageButton", "/immersion_engine/close-black.png");
            this.buttonTexture.addControl(this.imageButton, 0, 0);
            this.standWindowBack = BABYLON.MeshBuilder.CreateBox("standWindowBack", {height:0.3,width:0.3,depth:0.02});
            this.standWindowBack.parent = this.plinth;
            this.standWindowBack.position=new BABYLON.Vector3(positionCenter, this.height/2+0.25 , -positionFront+0.015);
            this.standWindowBack.material=this.immersion.interfaceMaterial;
            /* main window */
            var standWindow = BABYLON.MeshBuilder.CreatePlane("standWindow", {height:0.3, width: 0.3, sideOrientation: BABYLON.Mesh.DOUBLESIDE});
            standWindow.actionManager = new BABYLON.ActionManager(this.immersion);
            standWindow.enableEdgesRendering(); 
            standWindow.edgesColor = new BABYLON.Color4(1,1,1, 1);
            standWindow.edgesWidth = 0;
            standWindow.stand=this;
            standWindow.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){standWindow.edgesWidth = 0.2;}));
            standWindow.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(ev){standWindow.edgesWidth = 0;}));
            standWindow.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function(ev){
                standWindow.stand.windowSwitch();
            }));
            this.standWindow=standWindow;
            this.standWindow.parent = this.plinth;
            this.standWindow.position=new BABYLON.Vector3(positionCenter, this.height/2+0.25 ,-positionFront);
            this.standWindowTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.standWindow,300,300);
            this.standWindow.applyFog=false;
            this.standWindowTitle = new BABYLON.GUI.TextBlock();
            this.standWindowTitle.text = this.title;
            this.standWindowTitle.color = "white";
            this.standWindowTitle.height = "60px";
            this.standWindowTitle.width = "250px";
            this.standWindowTitle.lineSpacing = "5px";
            this.standWindowTitle.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            this.standWindowTitle.fontSize = 23;
            this.standWindowTexture.addControl(this.standWindowTitle);
            this.standWindowMessage = new BABYLON.GUI.TextBlock();
            this.standWindowMessage.text = "\n"+this.description;
            this.standWindowMessage.textWrapping=true;
            this.standWindowMessage.textVerticalAlignment="center";
            this.standWindowMessage.color = "white";
            this.standWindowMessage.height = "230px";
            this.standWindowMessage.width = "240px";
            this.standWindowMessage.lineSpacing = "8px";
            this.standWindowMessage.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.standWindowMessage.fontSize = 16;
            this.standWindowTexture.addControl(this.standWindowMessage);
            this.standWindowCloseMessage = new BABYLON.GUI.TextBlock();
            this.standWindowCloseMessage.text = this.immersion.texts.closeWindow;
            this.standWindowCloseMessage.textWrapping=true;
            this.standWindowCloseMessage.color = "white";
            this.standWindowCloseMessage.height = "40px";
            this.standWindowCloseMessage.width = "230px";
            this.standWindowCloseMessage.lineSpacing = "10px";
            this.standWindowCloseMessage.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.standWindowCloseMessage.fontSize = 14;
            this.standWindowTexture.addControl(this.standWindowCloseMessage);
        } else { /* deletes the window when switched off */
            this.standWindow.dispose();
            this.standWindowBack.dispose();
            this.standWindow=null;
            this.standWindowBack=null;
            if (this.standWindowLink) this.standWindowLink.dispose();
            if (this.standWindowLinkBack) this.standWindowLinkBack.dispose();
            this.buttonTexture.removeControl(this.imageButton);
            this.imageButton = new BABYLON.GUI.Image("imageButton", "/immersion_engine/info-black.png");
            this.buttonTexture.addControl(this.imageButton, 0, 0);
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // display functions to manage audio attached to the display
    loadSound (sound_data){ // attaches a sound to the display
        this.sound_data=sound_data;
    }
    pressSoundButton (){ // plays or stop the display sound
        this.immersion.playClick();
        if (this.sound_data){
            if (this.soundButton.textBlock.text==this.immersion.texts.play) this.playSound();
            else this.stopSound();
        }
    }
    playSound () { // plays the sound and stop those from other stands
        for (const stand of this.immersion.stands) {
            if (stand.sound_data) stand.stopSound();
        }
        this.soundButton.textBlock.text=this.immersion.texts.pause;
        if (this.soundTrack==null){ // if first time playing
            this.soundTrack = new BABYLON.Sound(this.sound, this.sound_data, this.immersion, null, {
                loop: this.loop,
                autoplay: true,
                spatialSound: false,
                rolloffFactor: this.factorSound,
                distanceModel: "exponential"
            });
            this.sound="onpress"; // doesn't play again the track automatically
            const matrix = this.plinth.computeWorldMatrix(true); 
            const soundPosition = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(this.plinth.position.x, 1.5, this.plinth.position.z), matrix); 
            this.soundTrack.setPosition(soundPosition);
            if (this.immersion.mute==true) BABYLON.Engine.audioEngine.setGlobalVolume(0);
            this.soundTrack.immersion=this.immersion;
            this.soundTrack.onended = function() {
                for (const stand of this.immersion.stands) {
                    if (stand.sound_data) stand.stopSound();
                }
            }
        }else {
            this.soundTrack.play(0);
            if (this.immersion.mute==true) BABYLON.Engine.audioEngine.setGlobalVolume(0);
        }
    }
    stopSound(){ 
        if (this.sound){
            if (this.soundButton.textBlock.text==this.immersion.texts.pause) { // if not the current stand and already playing
                this.soundTrack.stop();
                this.soundButton.textBlock.text=this.immersion.texts.play;
            }   
        }
    }
    doWhenArriving(){ // plays a sound automatically when arriving at a display 
        super.doWhenArriving();
        if (this.sound=="autoplay") {
            let shouldIPlay=true;
            for (const stand of this.immersion.stands) {
                if (stand.sound_data && stand.soundButton.textBlock.text==this.immersion.texts.pause) shouldIPlay=false;
            }
            if (shouldIPlay==true) this.playSound();
        }
    }
}









//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//PLINTH CLASS////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
// Plinths are displays with exhibit meshes
class Plinth extends Display {
    constructor(name,options,immersion) {
        if (options.width==null) options.width=0.3;
        if (options.depth==null) options.depth=0.3;
        if (options.distance==null) options.distance=0.5+options.depth;
        if (options.orientationPlinth!==null && options.orientationPlinth) options.distance=1.2;
        super(name,options,immersion)
        if (options.exhibit) this.exhibitMesh=options.exhibit;
        if (options.rotationE) this.rotationE=options.rotationE;
        // creates exhibit mesh
        if (this.exhibitMesh){
            if (this.exhibitMesh == true) this.exhibitMesh = BABYLON.MeshBuilder.CreateBox("exhibitMesh", {height: 0.2, width: 0.2, depth: 0.2});
            else this.exhibitMesh = this.exhibitMesh;
            this.exhibitMesh.parent=this.plinth;
            this.exhibitMesh.position = new BABYLON.Vector3(0, this.height/2+0.15, 0);
            this.exhibitMesh.rotation.y=BABYLON.Tools.ToRadians(90);
            if (this.rotationE==true) this.rotateExhibit();
            const matrix = this.exhibitMesh.computeWorldMatrix(true); 
            const global_position = BABYLON.Vector3.TransformCoordinates(this.exhibitMesh.position, matrix); 
            this.lookingAt.x=global_position.x;
            this.lookingAt.z=global_position.z;
        // creates a sound icon if no exhibit but some sound attached to the plinth
        }else if (this.sound){
            if (this.exhibitMesh==null && this.image==null){
                this.soundBox= BABYLON.MeshBuilder.CreateCylinder("cylinder", {diameterTop: 0.24,diameterBottom: 0.02,height:0.2});
                this.soundBox.parent=this.plinth;
                this.soundBox.material=this.styleMaterial;
                this.soundBox.position = new BABYLON.Vector3(0, this.height/2+0.05, 0);
                this.soundBall= BABYLON.MeshBuilder.CreateSphere("sphere", {diameter:0.12, slice:0.4});
                this.soundBall.parent=this.plinth;
                this.soundBall.material=this.styleMaterial;
                this.soundBall.position = new BABYLON.Vector3(0, this.height/2+0.14, 0);
            }
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // plinth function to rotate the exhibit
    rotateExhibit () {
        if (this.animatable && this.animatable.animationStarted==false) this.animatable.restart(); 
        else if (this.animatable && this.animatable.animationStarted==true) this.animatable.pause(); 
        else{
            this.exhibitMeshAnim = new BABYLON.Animation("exhibitAnim", "rotation.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            this.exhibitMeshKeys = []; 
            this.exhibitMeshKeys.push({frame: 0,value: 0});
            this.exhibitMeshKeys.push({frame: 300,value: 2 * Math.PI});
            this.exhibitMeshAnim.setKeys(this.exhibitMeshKeys);
            this.exhibitMesh.animations = [];
            this.exhibitMesh.animations.push(this.exhibitMeshAnim);
            this.animatable = this.immersion.beginAnimation(this.exhibitMesh, 0, 300, true);
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // plinth function to set the exhibit (called when the exibit file is loaded)
    setExhibit (exhibit) {
        exhibit.parent=this.exhibitMesh;
        this.exhibitMesh.isVisible=false;
    }

    //////////////////////////////////////////////////////////////////////////////////
    // plinth functions to add some animations when sound is playign
    playSound () {
        super.playSound();
        if (MODE!=="capture") this.startSoundAnim();
    }
    stopSound(){
        super.stopSound();
        if (this.sound){
            if (MODE!=="capture") this.stopSoundAnim();
        }
    }
    startSoundAnim(){
        if (this.soundBox){
            if (this.particleSystem) this.particleSystem.start();
            else {
                this.particleSystem = new BABYLON.ParticleSystem("particles", 10);
                this.particleSystem.parent = this.plinth;
                this.particleSystem.emitter=this.plinth;
                this.particleSystem.minEmitBox = new BABYLON.Vector3(-0.08,0.9,-0.08);
                this.particleSystem.maxEmitBox = new BABYLON.Vector3(0.08,0.9,0.08);
                this.particleSystem.minSize = 0.02;
                this.particleSystem.maxSize = 0.06;
                this.particleSystem.updateSpeed = 0.005;
                this.particleSystem.particleTexture = new BABYLON.Texture("/immersion_engine/flare.png");
                this.particleSystem.color1 = new BABYLON.Color4(1,1,1, 1);
                this.particleSystem.color2 = new BABYLON.Color4(1,1,1, 1);
                this.particleSystem.colordead = new BABYLON.Color4(1, 1, 1, 0);
                this.particleSystem.start();
            }
        }
    }
    stopSoundAnim(){
        if (this.particleSystem) this.particleSystem.stop();
    }
}







//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//CAROUSEL CLASS//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
// A Carousel is a plinth with some eye-catching text
// Not very useful but a good example on how to easily extend a navigation class
class Carousel extends Plinth {
    constructor(name,options,immersion) {
        super(name,options,immersion)
        if (options.carousel) this.carousel=options.carousel;
        if (this.carousel){
            this.exhibitMesh = this.createCarousel(this.carousel);
            this.exhibitMesh.parent=this.plinth;
            this.exhibitMesh.position = new BABYLON.Vector3(0, this.height/2+0.15, 0);
            this.exhibitMesh.rotation.y=BABYLON.Tools.ToRadians(90);
            if (this.rotationE==true) this.rotateExhibit();
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // carousel function to create the text box
    createCarousel(texts){
        var introBox = BABYLON.MeshBuilder.CreateBox("introBox", {height: 0.15, width: 0.15, depth: 0.15});
        var panel1 = BABYLON.MeshBuilder.CreatePlane("panel1", {height:0.16, width: 0.16, sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
        panel1.parent = introBox;
        panel1.position=new BABYLON.Vector3(0, 0, -0.08);
        var panel2 = BABYLON.MeshBuilder.CreatePlane("panel2", {height:0.16, width: 0.16, sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
        panel2.parent = introBox;
        panel2.rotation.y  =  BABYLON.Tools.ToRadians(-90);
        panel2.position=new BABYLON.Vector3(0.08, 0, 0);
        var panel3 = BABYLON.MeshBuilder.CreatePlane("panel3", {height:0.16, width: 0.16, sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
        panel3.parent = introBox;
        panel3.rotation.y  =  BABYLON.Tools.ToRadians(180);
        panel3.position=new BABYLON.Vector3(0, 0, 0.08);
        var panel4 = BABYLON.MeshBuilder.CreatePlane("panel4", {height:0.16, width: 0.16, sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
        panel4.parent = introBox;
        panel4.rotation.y  =  BABYLON.Tools.ToRadians(90);
        panel4.position=new BABYLON.Vector3(-0.08, 0, 0);
        var advancedTexture1 = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(panel1,64,64);
        advancedTexture1.background = "black";
        var advancedTexture2 = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(panel2,64,64);
        advancedTexture2.background = "black";
        var advancedTexture3 = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(panel3,64,64);
        advancedTexture3.background = "black";
        var advancedTexture4 = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(panel4,64,64);
        advancedTexture4.background = "black";
        var displayMessage = new BABYLON.GUI.TextBlock();
        displayMessage.textWrapping=true;
        displayMessage.text = texts[0];
        displayMessage.color = "white";
        displayMessage.fontSize = 22;
        advancedTexture1.addControl(displayMessage);
        var displayMessage2 = new BABYLON.GUI.TextBlock();
        displayMessage2.textWrapping=true;
        displayMessage2.text = texts[1];
        displayMessage2.color = "white";
        displayMessage2.fontSize = 22;
        displayMessage2.background = "black";
        advancedTexture2.addControl(displayMessage2);
        var displayMessage3 = new BABYLON.GUI.TextBlock();
        displayMessage3.textWrapping=true;
        displayMessage3.text = texts[2];
        displayMessage3.color = "white";
        displayMessage3.fontSize = 22;
        advancedTexture3.addControl(displayMessage3);
        var displayMessage4 = new BABYLON.GUI.TextBlock();
        displayMessage4.textWrapping=true;
        displayMessage4.text = texts[3];
        displayMessage4.color = "white";
        displayMessage4.fontSize = 22;
        displayMessage4.background = "black";
        advancedTexture4.addControl(displayMessage4);
        return introBox;
    }
}