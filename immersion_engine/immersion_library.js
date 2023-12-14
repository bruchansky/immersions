/*
The Immersion library is to create immersive experiences
in virtual reality and on the Web.
Version 2.2, January 2023, using babylon.js 3D engine version 5.0.2.
Copyright (C) 2023  Christophe Bruchansky
https://bruchansky.name/

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

Please keep the "Open Source" button & stand at the end of the 
immersion so that other creators can learn about the library.
Contact details and a list of all contributors are available on the 
project page: https://bruchansky.name/immersions.
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
    window.MUTE=true;
    window.MODE="arc";
    window.DEST=null;
    window.ENGINE_PATH = "/immersion_engine/";
    if (mode_p) MODE=mode_p; else if (mode_p == null && urlParams.has('mode')) MODE = urlParams.get('mode'); 
    if (mute_p) MUTE=mute_p; else if (mute_p == null && urlParams.has('mute')) MUTE = urlParams.get('mute'); 
    if (dest_p) DEST=dest_p; else if (dest_p == null && urlParams.has('dest')) DEST = urlParams.get('dest'); 
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
                immersion.activeCamera.position.y=immersion.viewHeight;
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
        this.userPosition="standing";
        this.style=style; // "light" or "dark" style of the immersion, used to adapt navigation colours
        var defaultOptionsScene = {
            createGround: false,
            skyboxSize : 500,
            sizeAuto: false,
            groundSize: 502,
            groundYBias: 0.01
            };
        this.fontName="Tahoma, Georgia"; //Tahoma, Georgia
        this.env = this.createDefaultEnvironment(defaultOptionsScene);
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 502, height: 502}, this);
        this.ground.checkCollisions = true;
        this.ground.isPickable = false; 
        this.XRTeleportMaterial = new BABYLON.StandardMaterial("pointer");  
        this.XRTeleportMaterial.backFaceCulling = false;
        this.XRTeleportMaterial.diffuseColor = BABYLON.Color3.White();
        this.XRTeleportMaterial.emissiveColor = BABYLON.Color3.White();
        if (MUTE) this.mute=true; else this.mute=false;
        this.addDefaultText(); // sets all default text
        BABYLON.Engine.audioEngine.setGlobalVolume(1);
        if (MODE=="dvp") this.debugLayer.show();
        this.sceneSounds= new Array();
        /* camera settings */
        if (MODE=="dvp") this.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0,0,0), this);
        else this.camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 0, new BABYLON.Vector3(0,0,0), this);
        this.camera.allowUpsideDown=false;
        this.camera.lowerRadiusLimit = 0.1;
        this.camera.attachControl(canvas, true);
        this.camera.minZ = 0.05;
        this.camera.angularSensibilityX = 4000;
        this.camera.angularSensibilityY = 4000;
        this.camera.wheelPrecision = 10;
        this.camera.pinchPrecision = 200;
        this.camera.speed = 0.1;
        this.camera.ellipsoid = new BABYLON.Vector3(0.05, this.viewHeight/2, 0.5);
        this.gravity = new BABYLON.Vector3(0, -0.9, 0);
        this.collisionsEnabled = true;
        this.camera.checkCollisions = true;
        this.camera.applyGravity = true;
        this.cameraMoving==false; // used to detect if a camera transition is ongoing
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
        var immersion = this;
        immersion.loadingShort="";
        immersion.loading="";
        this.assetsManager = new BABYLON.AssetsManager(this);
        this.assetsManager.useDefaultLoadingScreen = true;
        BABYLON.DefaultLoadingScreen.DefaultLogoUrl = "/immersion_engine/immersions-loading.PNG";
        //BABYLON.DefaultLoadingScreen.DefaultSpinnerUrl = "/immersion_engine/loadingIcon.png";
        engine.loadingUIText=immersion.loading;
        engine.loadingUIBackgroundColor="#333333";
        
        engine.displayLoadingUI();
        
        immersion.assetsManager.onProgress = function (remainingCount, totalCount, lastFinishedTask) { 
            var doneCount=totalCount-remainingCount;
            immersion.loadingShort=immersion.texts.loadingShort+"\n("+doneCount+"/"+totalCount+")";
            immersion.loading=immersion.texts.loadingText+immersion.texts.title.toUpperCase()+"<br><br>"+immersion.texts.loading+"("+doneCount+"/"+totalCount+")";
            const loadedCount = totalCount - remainingCount;
            const percentLoaded = Math.round(loadedCount / totalCount * 100);
            engine.loadingUIText=immersion.loading;
        };
        immersion.assetsManager.onFinish = function(tasks) {
            engine.hideLoadingUI();
            immersion.loadingButton.dispose();
            for (const stand of immersion.stands) {
                if (stand.name == "GATE_STAND") stand.stopLoading();
            }
            var result = new BABYLON.SceneOptimizerOptions(30, 2000);
            let priority = 0;
            //result.optimizations.push(new BABYLON.ShadowsOptimization(priority));
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
            this.texts.loadingText="<br><br><br><br><br>"
            this.texts.aboutImmersionsButton="Autres\nprojets";
            this.texts.aboutImmersionsLink="https://bruchansky.name/fr/immersions";
            this.texts.aboutTextButton="À\npropos"; 
            this.texts.aboutLink="https://bruchansky.name/fr"; 
            this.texts.exitTextButton="Autres\nprojets"; 
            this.texts.exitLink="https://bruchansky.name/fr/immersions"; 
            this.texts.fullText="Explore"; 
            this.texts.fullLink="https://bruchansky.name/plastic/?lang=fr"; 
            this.texts.inVR="- en VR et avec Audio -";
            this.texts.loading="Chargement";
            this.texts.loadingShort="Loading";
            this.texts.unmute="Son\n((0))";
            this.texts.mute="Son\n- x -";
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
            this.texts.pressHere="Clique\nIci";
            this.texts.shortInstr="Instru-\nctions";
            this.texts.instrTitle="Instructions";
            this.texts.instructions="Une fois le téléchargement terminé, clique sur les panneaux, boutons suivant et précédent afin d'explorer.\n\nAstuce: clique n'importe où et garde appuyé pour observer.";
            this.texts.nextLinks='Suite';
            this.texts.instructionsVR="Une fois le téléchargement terminé, déplace-toi en cliquant sur les pannaux ou en pointant le sol et en relachant la gâchette (voir schéma).";
            this.texts.enterLink="Clique\npour\nEntrer";
            this.texts.counterLink="Entrée\ndans ";
            this.texts.play="Écouter l'audio";
            this.texts.closeWindow="⇩ Clique pour fermer l'écran ⇩";
            this.texts.pause="Arrêter l'audio";
            this.texts.title="Titre Immersion"; 
            this.texts.author="Auteur"; 
            this.texts.about="À propos de l'immersion"; 
            this.texts.warning="AUSSI EN RÉALITÉ VIRTUELLE\n\nOuvre la page web sur\nton casque de réalité virtuelle.";
        }else {
            this.texts.loadingText="<br><br><br><br><br>"
            this.texts.aboutImmersionsButton="Other\nProjects";
            this.texts.aboutImmersionsLink="https://bruchansky.name/immersions";
            this.texts.aboutTextButton="About"; 
            this.texts.aboutLink="https://bruchansky.name"; 
            this.texts.exitTextButton="Other\nProjects"; 
            this.texts.exitLink="https://bruchansky.name/immersions";
            this.texts.fullText="Explore"; 
            this.texts.fullLink="https://bruchansky.name/plastic"; 
            this.texts.inVR="- In VR & with Audio -";
            this.texts.loading="Loading";
            this.texts.loadingShort="Loading";
            this.texts.unmute="Sound\n((o))";
            this.texts.mute="Mute\n- x -";
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
            this.texts.instructions="Click on signs, next & previous buttons to explore.\n\nTip: Tap anywhere on the screen and hold to look around.";
            this.texts.nextLinks='Next';
            this.texts.instructionsVR="Once download is complete, move by clicking on signs or selecting a position on the floor and releasing the trigger (see image below).";
            this.texts.enterLink="Press\nto\nEnter";
            this.texts.counterLink="Enter\nin ";
            this.texts.play="Press to play";
            this.texts.closeWindow="⇩ Click to close screen ⇩";
            this.texts.pause="Stop Audio";
            this.texts.title="Immersion Title"; 
            this.texts.author="Author Name"; 
            this.texts.about="About this immersion"; 
            this.texts.warning="AVAILABLE IN VR\n\nOpen the web page on\nyour virtual reality headset.";
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
    // setDefault = true to make this atmosphere the default one
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
        } 
    };
    
    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to play background sounds (if files loaded and not on mute)
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
                element.sound=m;
            }
        });
    }

    //////////////////////////////////////////////////////////////////////////////////
    // mute
    muteAll () {
        BABYLON.Engine.audioEngine.setGlobalVolume(0);
        this.mute=true;
    }

    //////////////////////////////////////////////////////////////////////////////////
    // unmute
    unmuteAll () {
        if (!MUTE){
            this.playSounds ();
            BABYLON.Engine.audioEngine.setGlobalVolume(1);
            this.mute=false;
        }
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
    // immersion function to play sound on clicks (if file loaded and not on mute)
    playClick () {
        if (this.mute==false){
            if (this.click==null){
                this.click=new BABYLON.Sound("click", this.clickData, this, null, {
                    loop: false,
                    autoplay: true,
                    spatialSound: false
                });
            }else this.click.play(0);
        }
        this.unmuteAll();
    }

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to initiate stands and add introduction ones
    initiateStands(standsOptions) {
        this.stands = new Array();
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
        this.interfaceMaterial = new BABYLON.StandardMaterial(this); 
        this.interfaceMaterial.emissiveColor = BABYLON.Color3.Black();

        this.interfaceMaterial.disableLighting = true;
        this.clickMaterial = new BABYLON.StandardMaterial(this); 
        this.clickMaterial.emissiveColor = new BABYLON.Color3(0.10196, 0.40000, 0.00000);
        this.clickMaterial.disableLighting=true;
        this.clickMaterial.alpha=0.4;
        this.ballMaterial = new BABYLON.StandardMaterial(this); 
        this.ballMaterial.emissiveColor = new BABYLON.Color3(0.9, 0.9, 0.9);
        this.ballMaterial.alpha=1;
        this.ballHMaterial = new BABYLON.StandardMaterial(this); 
        this.ballHMaterial.emissiveColor = new BABYLON.Color3.Green();
        this.ballHMaterial.alpha=1;
        this.ballHMaterial.disableLighting=true;
        this.ballBMaterial = new BABYLON.StandardMaterial(this); 
        this.ballBMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.ballBMaterial.alpha=0.6;
        this.ballBMaterial.disableLighting=true;
        this.clickLinkMaterial = new BABYLON.StandardMaterial(this); 
        this.clickLinkMaterial.emissiveColor = new BABYLON.Color3(1,1,0);
        this.clickLinkMaterial.disableLighting=true;
        this.clickLinkMaterial.alpha=0.8;
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
        // first stand with welcome message
        var WELCOME_STAND = new Display ("WELCOME_STAND",{
            windowOpened: true,
            animationActivated:false,
            title:this.texts.welcome,
            text:this.texts.pressHere,
            description: this.texts.about,
            position: new BABYLON.Vector3(0,0,-170),
            lookingAt: new BABYLON.Vector3(0,1.5,-169),
            style:"light"
        },this);
        this.addStand(WELCOME_STAND);
        // "start" stand that is activated when all assets are loaded (see logic in the constructor and Gate class)
        var GATE_STAND = new Gate ("GATE_STAND",{
            gate: "_NEXT",
            lineFrom: "WELCOME_STAND",
            position: new BABYLON.Vector3(0,0,-161.5),
            lookingAt: new BABYLON.Vector3(0,1.75,-160.5),
            style:"light"
        },this);
        this.addStand(GATE_STAND);
        // balls
        var ball1 = this.createball(new BABYLON.Vector3(0.7, 0, -161),0.9);
        var ball2 = this.createball(new BABYLON.Vector3(-0.8, 0, -162),0.8);
        var ball2 = this.createball(new BABYLON.Vector3(-1, 0, -168.5),0.9);
    };

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to create balls where to sit
    createball(position,sizeBall) {
        var ball = BABYLON.MeshBuilder.CreateSphere("standBox", {diameter:0.8});
        ball.hidingDistance=50;
        ball.material=this.ballMaterial;
        ball.applyFog=false;
        ball.scalingDeterminant=sizeBall;
        ball.rotation.x=Math.random()* Math.PI;
        ball.rotation.y=Math.random()* Math.PI;
        ball.rotation.z=Math.random()* Math.PI;
        ball.position=position;
        ball.position.y=(sizeBall*0.8)/2-0.03;
        var ballBorder1 = BABYLON.MeshBuilder.CreateTorus("ballBorder1", {diameter:0.8,thickness:0.02});
        ballBorder1.material=this.ballBMaterial;
        ballBorder1.parent=ball;
        var ballBorder2 = BABYLON.MeshBuilder.CreateTorus("ballBorder2", {diameter:0.7,thickness:0.02});
        ballBorder2.material=this.ballBMaterial;
        ballBorder2.position=new BABYLON.Vector3(0, 0.2, 0);
        ballBorder2.parent=ball;
        var ballBorder3 = BABYLON.MeshBuilder.CreateTorus("ballBorder3", {diameter:0.7,thickness:0.02});
        ballBorder3.material=this.ballBMaterial;
        ballBorder3.position=new BABYLON.Vector3(0, -0.2, 0);
        ballBorder3.parent=ball;
        return ball;
    }
    
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
        this.currentStand().attachCamera(false);
        this.automatedActions();
        if (MODE=="screenshot" ||DEST) {
            for (const s of this.stands) {
                if (s.name!=="WELCOME_STAND"){
                    s.standBase.isVisible=false;
                    if (s.standSign) {
                        s.standSign.isVisible=false;
                        s.standSign._children[0].isVisible=false;
                        s.standSign._children[1].isVisible=false;
                        s.standSign._children[2].isVisible=false;
                    }
                    if (s.standBox) s.standBox.isVisible=false;
                    if (s.standLines) s.standLines.isVisible=false;
                    if (s.plinth) s.plinth.isVisible=false;
                    if (DEST && s.exhibitMesh && s.name==DEST) s.plinth.isVisible=true;
                    if (s.plinthBase) s.plinthBase.isVisible=false;
                    if (s.soundLinkBack) s.soundLinkBack.isVisible=false;
                    if (s.soundButton) s.soundButton.isVisible=false;
                    if (s.soundLink) s.soundLink.isVisible=false;
                    if (s.actionLinkBack) s.actionLinkBack.isVisible=false;
                    if (s.actionButton) s.actionButton.isVisible=false;
                    if (s.actionLink) s.actionLink.isVisible=false;
                    if (s.soundBox) s.soundBox.isVisible=false;
                    if (s.soundBall) s.soundBall.isVisible=false;
                    if (s.standImage) s.standImage.isVisible=false;
                    if (s.image) s.image.isVisible=false;
                    if (s.standWindow) s.standWindow.isVisible=false;
                    if (s.standWindowBack) s.standWindowBack.isVisible=false;
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
            this.nextButton.isVisible=true;
        }

        this.stands[this.currentStandIndex].attachCamera(true);
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
            if (DEST) this.activeCamera.anim.stop(); // stop rotating animation 
            if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh) {
                switch (pointerInfo.type) {
                    case BABYLON.PointerEventTypes.POINTERDOWN:
                    if(pointerInfo.pickInfo.hit) {
                        // in dvp mode, display mesh positions when clicked
                        var meshPosition = pointerInfo.pickInfo.pickedMesh.getAbsolutePosition();
                        if (MODE=="dvp") console.log(pointerInfo.pickInfo.pickedMesh.name+': x:'+meshPosition.x.toFixed(1)+',y:'+meshPosition.y.toFixed(1)+',z:'+meshPosition.z.toFixed(1));
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
        immersion.counterCheckDistance=0;
        immersion.registerBeforeRender(function () {
            // change settings is user is seated
            if (immersion.inXR==true) {
                if (immersion.activeCamera.position.y<1.25 && immersion.userPosition=="standing") {
                    immersion.userPosition="seated";
                    for (const stand of immersion.stands) {
                        if (stand.plinth) {
                            stand.plinth.position.y = stand.plinth.position.y-0.60;
                            stand.plinth.isVisible=false;
                            stand.plinthBase.isVisible=false;
                        }
                    }
                }else if (immersion.activeCamera.position.y>=1.25 && immersion.userPosition=="seated") {
                    immersion.userPosition="standing";
                    for (const stand of immersion.stands) {
                        if (stand.plinth) {
                            stand.plinth.position.y = stand.plinth.position.y+0.60;
                            stand.plinth.isVisible=true;
                            stand.plinthBase.isVisible=true;
                        }
                    }
                }
            }
            // Recomputes camera position based on updated target
            if (MODE!=="dvp" && immersion.inXR==false && immersion.cameraMoving==true) {
                immersion.activeCamera.position=immersion.activeCamera._p;
                immersion.activeCamera.rebuildAnglesAndRadius();
            }
            // Updates all meshes having a calledOnEveryFrame function
            immersion.meshes.forEach(element => {
                if (element.calledOnEveryFrame) element.calledOnEveryFrame(immersion);
            });
            immersion.counterCheckDistance++;
            
            if (immersion.counterCheckDistance==10){
                immersion.meshes.forEach(element => {
                    if (element.hidingDistance){
                        var global_position = element.position;
                        if (element.parent && element.parent.position){ // if no parent or parent is a root (instantiateModelsToScene from Mixamo)
                            const matrix = element.computeWorldMatrix(true); 
                            global_position = BABYLON.Vector3.TransformCoordinates(element.position, matrix); 
                        }
                        if (global_position.subtract(immersion.activeCamera.position).length()<element.hidingDistance && !element.isEnabled()){
                            element.setEnabled(true);
                        } else if (global_position.subtract(immersion.activeCamera.position).length()>=element.hidingDistance && element.isEnabled() ){
                            element.setEnabled(false);
                        }
                    }
                });
                immersion.counterCheckDistance=0;
            }
            // Updates coordinates displayed in dvp mode
            if (MODE=="dvp") immersion.coordinatesDisplay.text = 'x:'+immersion.activeCamera.position.x.toFixed(1)+',y:'+immersion.activeCamera.position.y.toFixed(1)+',z:'+immersion.activeCamera.position.z.toFixed(1)+',Looking at @x:'+immersion.activeCamera.getTarget().x.toFixed(2)+',@y:'+immersion.activeCamera.getTarget().y.toFixed(2)+',@z:'+immersion.activeCamera.getTarget().z.toFixed(2);
            // Loads assets and displays loading animation until everything is loaded
            if (immersion.loadingButton && immersion.loadingButton!==null){
                if (immersion.loadingButton.counter==140) immersion.assetsManager.load();
                if (immersion.loadingButton.counter<=0) immersion.loadingButton.counter=121;
                immersion.loadingButton.counter--;
                if (immersion.loadingButton.counter==120 ) engine.loadingUIText=immersion.loading;
                else if (immersion.loadingButton.counter==90 ) engine.loadingUIText=immersion.loading+".";
                else if (immersion.loadingButton.counter==60 ) engine.loadingUIText=immersion.loading+"..";
                else if (immersion.loadingButton.counter==30 ) engine.loadingUIText=immersion.loading+"...";
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
        MUTE=false;
        for (const stand of this.stands) {
        }
    };

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to display the 2D navigation
    showNavigation () {
        this.fullscreenUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        if (MODE=="screenshot") this.fullscreenUI.idealHeight = 1500; 
        else if (window.innerHeight<=500) this.fullscreenUI.idealHeight = 550; 
        else this.fullscreenUI.idealHeight = 800;
        if (this.style=="light") var bgcolour="black"; else var bgcolour="white";
        if (this.style=="light") var textcolour="white"; else var textcolour="black"; 
        // loading text 
        var loadingButton = new BABYLON.GUI.TextBlock();
        loadingButton.fontFamily = this.fontName;
        loadingButton.text="";
        loadingButton.fontSize = "20px";
        loadingButton.height = "75px";
        loadingButton.width = "250px";
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
        loadingButton.counter=200; // number used to initiate loading loop 
        loadingButton.isVisible=false;
        this.loadingButton=loadingButton;

        // sound button
        var textsoundButton=this.texts.mute;
        if (this.mute==true) textsoundButton=this.texts.unmute;
        var soundButton = BABYLON.GUI.Button.CreateSimpleButton("soundButton", textsoundButton);
        soundButton.fontSize = "14px";
        soundButton.height = "60px";
        soundButton.width = "80px";
        soundButton.paddingRight = "10px";
        soundButton.paddingTop="10px";
        soundButton.cornerRadius = 10;
        soundButton.color = textcolour;
        soundButton.fontFamily = this.fontName;
        soundButton.thickness = 0;
        soundButton.background = bgcolour;
        soundButton.alpha=0.8;
        soundButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        soundButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        soundButton.immersion=this;
        soundButton.onPointerUpObservable.add(function() {
            if (soundButton.immersion.mute==true) {
                MUTE=false;
                soundButton.immersion.unmuteAll();
                soundButton.textBlock.text=soundButton.immersion.texts.mute;
            }
            else if (soundButton.immersion.mute==false) {
                MUTE=true;
                soundButton.immersion.muteAll();
                soundButton.textBlock.text=soundButton.immersion.texts.unmute;
            }
        });
        this.fullscreenUI.addControl(soundButton);
        this.soundButton=soundButton; 
        // about button
        var aboutButton = BABYLON.GUI.Button.CreateSimpleButton("aboutButton", this.texts.aboutTextButton);
        aboutButton.fontSize = "14px";
        aboutButton.height = "120px";
        aboutButton.width = "80px";
        aboutButton.paddingRight = "10px";
        aboutButton.paddingTop="70px";
        aboutButton.fontFamily = this.fontName;
        aboutButton.cornerRadius = 10;
        aboutButton.color = "black";
        aboutButton.thickness = 0;
        aboutButton.background = "yellow";
        if (DEST) aboutButton.textBlock.text=this.texts.fullText;
        if (DEST) aboutButton.link=this.texts.fullLink;
        else aboutButton.link=this.texts.aboutLink;
        aboutButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        aboutButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        aboutButton.immersion=this;
        aboutButton.onPointerUpObservable.add(function() {
            aboutButton.immersion.muteAll();
            window.open(aboutButton.link)
        });
        this.fullscreenUI.addControl(aboutButton); 
        this.aboutButton=aboutButton;
        // next button
        var nextButton = BABYLON.GUI.Button.CreateSimpleButton("nextButton", "⇧");
        nextButton.fontSize = "30px";
        nextButton.height = "190px";
        nextButton.width = "80px";
        nextButton.paddingTop="130px";
        nextButton.paddingRight="10px";
        nextButton.cornerRadius = 10;
        nextButton.color = "white";
        nextButton.thickness = 0;
        nextButton.background = "green";
        nextButton.alpha=0.8;
        nextButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        nextButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        nextButton.immersion=this;
        nextButton.onPointerUpObservable.add(function() {
            nextButton.immersion.unmuteAll();
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
                    nextButton.isVisible=true;
                }
                nextButton.immersion.currentStand().attachCamera(true);
            }
        });
        this.fullscreenUI.addControl(nextButton);  
        this.nextButton=nextButton;
        // previous button
        var previousButton = BABYLON.GUI.Button.CreateSimpleButton("previousButton", "⇩");
        previousButton.fontSize = "30px";
        previousButton.height = "260px";
        previousButton.width = "80px";
        previousButton.paddingTop="200px";
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
            previousButton.immersion.unmuteAll();
            previousButton.immersion.goPreviousStand();
            previousButton.immersion.currentButton.isVisible=false;
            if (previousButton.immersion.currentStandIndex>0) {
                previousButton.isVisible=true;
            } else {
                previousButton.isVisible=false;
            }
            previousButton.immersion.nextButton.isVisible=true;
            
            previousButton.immersion.currentStand().attachCamera(true);
        });
        this.fullscreenUI.addControl(previousButton); 
        if (this.currentStandIndex!==null && !DEST) previousButton.isVisible=false; else previousButton.isVisible=true;
        if (DEST){
            nextButton.isVisible=false;
            previousButton.isVisible=false;
        }
        this.previousButton=previousButton;
        // current button ("back to position")
        var currentButton = BABYLON.GUI.Button.CreateSimpleButton("currentButton", this.texts.backPosition);
        currentButton.cornerRadius = 10;
        currentButton.color = "white";
        currentButton.thickness = 0; 
        currentButton.background = "green";
        currentButton.fontSize = "14px";
        currentButton.fontFamily = this.fontName;
        currentButton.alpha=0.8;
        if (MODE=="screenshot") {
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
            currentButton.immersion.unmuteAll();
            currentButton.isVisible=false;
            currentButton.immersion.currentStand().attachCamera(false);

        });
        this.fullscreenUI.addControl(currentButton);   
        currentButton.isVisible=false;
        this.currentButton=currentButton;
        // displays coordinates when in dvp mode
        if (MODE=="dvp") {
            if (this.style=="light") var colour="black"; else var colour="white";
            this.coordinatesDisplay = new BABYLON.GUI.TextBlock();
            this.coordinatesDisplay.fontFamily = this.fontName;
            this.coordinatesDisplay.text = "";
            this.coordinatesDisplay.color = colour;
            this.coordinatesDisplay.height = "20px";
            this.coordinatesDisplay.fontSize = "24px";
            this.fullscreenUI.addControl(this.coordinatesDisplay);   
            this.coordinatesDisplay.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        }
        // adds some extra navigation when in screenshot mode
        if (MODE=="screenshot") {
            var actionButton = BABYLON.GUI.Button.CreateSimpleButton("actionButton", this.texts.action);
            actionButton.paddingLeft = "10px";
            actionButton.paddingTop="10px";
            actionButton.height = "60px";
            actionButton.width = "80px";
            actionButton.fontFamily = this.fontName;
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

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to pause an object animation when clicked
    // startBydefault=false to pause the object animation by default
    // default style of the rollover are wireframes
    // style="whiter" to display the object brighter instead
    pauseOnClick(mesh, anim, startByDefault, style) {
        mesh.startByDefault=startByDefault;
        if (!startByDefault) anim.pause();
        mesh.actionManager = new BABYLON.ActionManager(this);
        if (style=='whiter'){
            mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){mesh.material.emissiveColor=new BABYLON.Color4(1,1,1);}));
            mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(ev){mesh.material.emissiveColor=new BABYLON.Color4(0,0,0);}));
        }else {
            mesh.edgesColor = new BABYLON.Color4(1,1,1, 1);
            mesh.enableEdgesRendering();
            mesh.edgesWidth = 0;
            mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){mesh.edgesWidth = 0.2;}));
            mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(ev){mesh.edgesWidth = 0;}));
            }
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function(ev){
            mesh.edgesWidth = 0;
            mesh.material.emissiveColor=new BABYLON.Color4(0,0,0);
            if (mesh.startByDefault==true) {
                mesh.startByDefault=false;
                anim.pause();
            }else{
                mesh.startByDefault=true;
                anim.restart(); 
            }
        }));
        
    }

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to make objects appear/disappear when clicked
    // controler is the mesh to click on
    // targets is an array of meshes that should appear/disappear
    // isVisible=false if the target objects should be hidden by default
    disappearOnClick(controler, targets, isVisible) {
        controler.switchedOn=isVisible;
        if (isVisible==false) targets.forEach(element => element.isVisible=false);
        controler.edgesColor = new BABYLON.Color4(1,1,1, 1);
        controler.enableEdgesRendering();
        controler.edgesWidth = 0;
        controler.actionManager = new BABYLON.ActionManager(this);
        controler.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){controler.edgesWidth = 0.2;}));
        controler.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(ev){controler.edgesWidth = 0;}));
        controler.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function(ev){
            controler.edgesWidth = 0;
            controler.material.emissiveColor=new BABYLON.Color4(0,0,0);
            if (controler.switchedOn==false) {
                controler.switchedOn=true;
                targets.forEach(element => element.isVisible=true);
            }else{
                controler.switchedOn=false;
                targets.forEach(element => element.isVisible=false);
            }
        }));
    }

    //////////////////////////////////////////////////////////////////////////////////
    // immersion function to highlight a mesh when pointer is over 
    highlight(mesh) {
        mesh.edgesColor = new BABYLON.Color4(1,1,1, 1);
        mesh.enableEdgesRendering();
        mesh.edgesWidth = 0;
        mesh.actionManager = new BABYLON.ActionManager(this);
        var immersion=this;
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){
            if (mesh.name=="standBox"){
                mesh.material=immersion.ballHMaterial;
            } else mesh.edgesWidth = 0.2;
        }));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function(ev){
            if (mesh.name=="standBox"){
                if (mesh.parent.gate && mesh.parent.gate.includes('/')) mesh.material=immersion.clickLinkMaterial;
                else mesh.material=immersion.ballMaterial;
            } else mesh.edgesWidth = 0;
        }));
        return mesh.actionManager;
    }


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
        if (options.animationActivated!==null) this.animationActivated=options.animationActivated;
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
        this.standBase = BABYLON.MeshBuilder.CreateCylinder("standBase", {diameter: 0.8, height:0.07});
        this.standBase.applyFog=false;
        this.standBase.material = immersion.selectionMaterial;
        this.standBase.parent=this;
        this.standBase.hidingDistance=50;

        // Highlights the stand base when pointed

        var standBase=this.standBase;
        standBase.stand=this;
            
        // Performs tasks when arriving on the stand
        standBase.standName=this.name;
        standBase.atmosphere=this.atmosphere;
        standBase.isActive=false;
        standBase.calledOnEveryFrame = (immersion) => {
            if (standBase.parent.position.subtract(immersion.activeCamera.position).length()<2.8 && standBase.isActive==false){
                if (immersion.inXR==true) immersion.setCurrentStand(standBase.stand.name); // in case the user moved to the stand without clicking anything (VR mode)
                standBase.isActive=true;
                standBase.stand.doWhenArriving();
            } else if (standBase.parent.position.subtract(immersion.activeCamera.position).length()>=2.8 && standBase.isActive==true ){
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
        this.standSign=this.immersion.createball(new BABYLON.Vector3(0, 0.4, 0),1);
        //this.standSign = BABYLON.MeshBuilder.CreatePolyhedron("standBox", {size:0.35,type:3});
        this.standSign.hidingDistance=50;
        this.standSign.applyFog=false;
        /*
        const rotationAnim = new BABYLON.Animation("rotationAnim", "rotation.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        const keys = []; 
        keys.push({frame: 0,value: 0});
        keys.push({frame: 300,value: 2 * Math.PI});
        rotationAnim.setKeys(keys);
        this.standSign.animations = [];
        this.standSign.animations.push(rotationAnim);
        this.standSign.anim = immersion.beginAnimation(this.standSign, 0, 600, true);
        */
        this.standSign.parent=this;
        //this.standSign.position=new BABYLON.Vector3(0, 0.45, 0);
        // Highlights sign when pointed
        var standSign=this.standSign;
        standSign.stand=this;
        var actionManager=immersion.highlight(standSign);
        const action = actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function(ev){immersion.setCurrentStand(standBase.stand.name);}));
        standSign.clickAction=action;
        this.standSignText=BABYLON.MeshBuilder.CreatePlane("standSignText", {height:0.7, width: 0.7, sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
        this.standSignText.position=new BABYLON.Vector3(0, 0.47, -0.45);
        this.standSignText.material=immersion.interfaceMaterial;
        this.standSignText.isVisible=false;
        this.standSignText.isPickable=false;
        this.standSignText.applyFog=false;
        this.standSignText.parent=this;
        if (this.text){
            if (MODE!="screenshot" && !DEST) {
                this.standSignText.isVisible=true;
            }
            this.standMessage = BABYLON.GUI.Button.CreateSimpleButton("standMessage", "");
            this.standMessage.thickness = 0;
            this.standMessage.textBlock.text = this.text;
            this.standMessage.fontFamily = this.immersion.fontName;
            if (this.standMessage.textBlock.text.length>1) this.standMessage.fontSize = 55; else this.standMessage.fontSize = 150; // adapt text size 
            this.standMessage.height = "256px";
            this.standMessage.width = "256px";
            this.standMessage.textWrapping=true;
            this.standMessage.color = "black";
            this.standTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.standSignText,256,256);
            this.standTexture.alpha = 0.7;

            this.standTexture.addControl(this.standMessage);
            // activate immersion sounds when first clicked on a stand
            var standMessage = this.standMessage;
            standMessage.immersion=immersion;
            standMessage.onPointerUpObservable.add(function() {
                standMessage.immersion.unmuteAll();
            });
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // stand function to perform automated tasks when landing
    doWhenArriving(){
        this.immersion.setAtmosphere(this.standBase.atmosphere,false);
        if (this.standSign && MODE!=="screenshot" && !DEST){
            this.standSign.isVisible=false;
            this.standSign._children[0].isVisible=false;
            this.standSign._children[1].isVisible=false;
            this.standSign._children[2].isVisible=false;
            this.standSignText.isVisible=false;
            if (this.description) this.standWindow.isVisible=true;
            if (this.description) this.standWindowBack.isVisible=true;
            if (this.description) this.standWindowBack.isPickable=true;
            if (this.soundLinkBack) this.soundLinkBack.isVisible=true;
            if (this.soundLink) this.soundLink.isVisible=true;
            if (this.soundButton) this.soundButton.isVisible=true;
            if (this.actionLinkBack) this.actionLinkBack.isVisible=true;
            if (this.actionLink) this.actionLink.isVisible=true;
            if (this.actionButton) this.actionButton.isVisible=true;
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // stand function to perform automated tasks when leaving 
    doWhenLeaving(){
        if (this.standSign && MODE!=="screenshot" && !DEST){
            this.standSign.isVisible=true;
            this.standSign._children[0].isVisible=true;
            this.standSign._children[1].isVisible=true;
            this.standSign._children[2].isVisible=true;
            if (this.text) this.standSignText.isVisible=true;
            if (this.description) this.standWindow.isVisible=false;
            if (this.description) this.standWindowBack.isVisible=false;
            if (this.description) this.standWindowBack.isPickable=false;
            if (this.soundLinkBack) this.soundLinkBack.isVisible=false;
            if (this.soundLink) this.soundLink.isVisible=false;
            if (this.soundButton) this.soundButton.isVisible=false;
            if (this.actionLinkBack) this.actionLinkBack.isVisible=false;
            if (this.actionLink) this.actionLink.isVisible=false;
            if (this.actionButton) this.actionButton.isVisible=false;
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    // stand function to move the camera when selected
    attachCamera(withAnimation){
        if (withAnimation==true && this.animationActivated!==null && this.animationActivated==false) withAnimation=false;
        if (DEST && this.immersion.cameraRotating==null && this.immersion.inXR==false){
            this.immersion.activeCamera.position.x=this.position.x;
            this.immersion.activeCamera.position.y= this.immersion.viewHeight;
            this.immersion.activeCamera.position.z=this.position.z;
            if (this.immersion.inXR==false) this.immersion.activeCamera.setTarget(this.lookingAt.clone());
            if (this.immersion.inXR==false && MODE!=="dvp") this.immersion.activeCamera.rebuildAnglesAndRadius();
            const FRAMES_PER_SECOND = 30;
            const TO_FRAME = 1000;
            var cameraRot = new BABYLON.Animation("cameraRot", "alpha", FRAMES_PER_SECOND, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            const keysr = []; 
            this.immersion.cameraRotating=true;
            var r = this.immersion.activeCamera.alpha;
            keysr.push({frame: 0,value: r});
            keysr.push({frame: TO_FRAME,value: r+2*Math.PI});
            cameraRot.setKeys(keysr);
            this.immersion.activeCamera.animations = [];
            this.immersion.activeCamera.animations.push(cameraRot);
            this.immersion.activeCamera.anim = this.immersion.beginAnimation(this.immersion.activeCamera, 0, TO_FRAME, true);
        } else if (withAnimation && this.immersion.inXR==false && MODE!=="dvp") {
            this.immersion.nextButton.isEnabled=false;
            this.immersion.previousButton.isEnabled=false;
            const FRAMES_PER_SECOND = 30;
            const TO_FRAME = 50;
            this.immersion.cameraMoving=true;
            this.immersion.activeCamera._p=new BABYLON.Vector3(0, 0,0);
            var cameraAnimx = new BABYLON.Animation("cameraAnimx", "_p.x", FRAMES_PER_SECOND, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var cameraAnimy = new BABYLON.Animation("cameraAnimy", "_p.y", FRAMES_PER_SECOND, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var cameraAnimz = new BABYLON.Animation("cameraAnimz", "_p.z", FRAMES_PER_SECOND, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var cameraAnimtx = new BABYLON.Animation("cameraAnimtx", "target.x", FRAMES_PER_SECOND, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var cameraAnimty= new BABYLON.Animation("cameraAnimty", "target.y", FRAMES_PER_SECOND, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var cameraAnimtz = new BABYLON.Animation("cameraAnimtz", "target.z", FRAMES_PER_SECOND, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            const keysx = []; 
            keysx.push({frame: 0,value: this.immersion.activeCamera.position.x});
            keysx.push({frame: TO_FRAME,value: this.position.x});
            cameraAnimx.setKeys(keysx);
            const keysy = []; 
            keysy.push({frame: 0,value: this.immersion.activeCamera.position.y});
            keysy.push({frame: TO_FRAME,value: this.immersion.viewHeight});
            cameraAnimy.setKeys(keysy);
            const keysz = []; 
            keysz.push({frame: 0,value: this.immersion.activeCamera.position.z});
            keysz.push({frame: TO_FRAME,value: this.position.z});
            cameraAnimz.setKeys(keysz);
            const keystx = []; 
            keystx.push({frame: 0,value: this.immersion.activeCamera.target.x});
            keystx.push({frame: TO_FRAME,value: this.lookingAt.x});
            cameraAnimtx.setKeys(keystx);
            const keysty = []; 
            keysty.push({frame: 0,value: this.immersion.activeCamera.target.y});
            keysty.push({frame: TO_FRAME,value: this.lookingAt.y});
            cameraAnimty.setKeys(keysty);
            const keystz = []; 
            keystz.push({frame: 0,value: this.immersion.activeCamera.target.z});
            keystz.push({frame: TO_FRAME,value: this.lookingAt.z});
            cameraAnimtz.setKeys(keystz);
            this.immersion.activeCamera.animations = [];
            this.immersion.activeCamera.animations.push(cameraAnimx);
            this.immersion.activeCamera.animations.push(cameraAnimy);
            this.immersion.activeCamera.animations.push(cameraAnimz);
            this.immersion.activeCamera.animations.push(cameraAnimtx);
            this.immersion.activeCamera.animations.push(cameraAnimty);
            this.immersion.activeCamera.animations.push(cameraAnimtz);


            this.immersion.activeCamera.anim = this.immersion.beginAnimation(this.immersion.activeCamera, 0, TO_FRAME, false);
            
            var immersion=this.immersion;
            var lookingAt=this.lookingAt.clone();
            var position=this.position;
            this.immersion.activeCamera.anim.onAnimationEnd = function(){
                immersion.nextButton.isEnabled=true;
                immersion.previousButton.isEnabled=true;
                immersion.activeCamera.setTarget(lookingAt);
                immersion.activeCamera.position.x=position.x;
                immersion.activeCamera.position.y= immersion.viewHeight;
                immersion.activeCamera.position.z=position.z;
                immersion.activeCamera.rebuildAnglesAndRadius();
                immersion.cameraMoving=false;
            }
        } else {
            this.immersion.activeCamera.position.x=this.position.x;
            if (this.immersion.inXR==false) this.immersion.activeCamera.position.y= this.immersion.viewHeight;
            this.immersion.activeCamera.position.z=this.position.z;
            if (this.immersion.inXR==false) this.immersion.activeCamera.setTarget(this.lookingAt.clone());
            if (this.immersion.inXR==false && MODE!=="dvp") this.immersion.activeCamera.rebuildAnglesAndRadius();
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
        if (this.gate && !this.gate.includes('/')){
            // adds loading text if it is the immersion gate
            if (this.name == "GATE_STAND") {
                this.standSign.isPickable=false;
                var standMessage = this.standMessage;
                var standSign=this.standSign;
                this.standSign.standMessage=standMessage;
                standMessage.textBlock.text=immersion.loadingShort;
                standSign.calledOnEveryFrame = (immersion) => { // displays loading status
                    standSign.standMessage.textBlock.text=immersion.loadingShort;
                }
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
        this.activateGate();
    }

    //////////////////////////////////////////////////////////////////////////////////
    // gate function that teleports the user
    activateGate(){
        var immersion=this.immersion;
        var standSign=this.standSign;
        standSign.gateName=this.gate;
        standSign.calledOnEveryFrame = (immersion) => {}
    }

    // extends the attachCamera function so that the camera moves automatically to the next gate
    attachCamera(withAnimation){
        super.attachCamera(withAnimation);
        if (withAnimation==true && this.animationActivated!==null && this.animationActivated==false) withAnimation=false;
        if (withAnimation && this.immersion.inXR==false && MODE!=="dvp") {
            var immersion=this.immersion;
            var lookingAt=this.lookingAt.clone();
            var position=this.position;
            var gateName=this.gate;
            this.immersion.activeCamera.anim.onAnimationEnd = function(){
                immersion.activeCamera.setTarget(lookingAt);
                immersion.activeCamera.position.x=position.x;
                if (immersion.inXR==false) immersion.activeCamera.position.y= immersion.viewHeight;
                immersion.activeCamera.position.z=position.z;
                immersion.activeCamera.rebuildAnglesAndRadius();
                immersion.cameraMoving=false;
                if (gateName) {
                    if (gateName=="_NEXT") gateName=immersion.nextStand().name; 
                    immersion.setCurrentStand(gateName);
                } 
            }
        } else {
            if (this.gate) {
                if (this.gate=="_NEXT") this.gate=this.immersion.nextStand().name; 
                this.immersion.setCurrentStand(this.gate);
            } 
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
        super(name,options,immersion);
        //this.standSign.isPickable=true;
        this.standSign.material=immersion.clickLinkMaterial;
        this.standMessage.color = "black";
        this.standSign.applyFog=false;
        this.standSign._children[0].isVisible=false;
        this.standSign._children[1].isVisible=false;
        this.standSign._children[2].isVisible=false;
        
    }

    // Overwrites the attachCamera function to open a window when clicked 
    attachCamera(withAnimation){
        if (this.gate && this.gate.includes('/')){
            this.immersion.muteAll();
            window.open(this.gate);
            // temporary solution 
            if (this.immersion.inXR==true) {
                this.immersion.xr.baseExperience.exitXRAsync();
            }
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
        if (options.windowOpened && MODE!=="screenshot" && !DEST) this.windowOpened=options.windowOpened;
        if (options.image!==null && options.image) this.imageURL=options.image;
        if (options.action) this.action=options.action 
        if (options.sound!==null && options.sound) this.sound=options.sound; // only if sound
        if (options.loop!==null && options.loop) this.loop=options.loop; else this.loop=false; // only if sound
        if (options.factorSound!==null && options.factorSound) this.factorSound=options.factorSound; else this.factorSound=0.8; // only if sound
        if (options.height!==null && options.height) this.height=options.height; else this.height=1.25; // default display height
        if (options.distance!==null && options.distance) this.distance=options.distance; else this.distance = 1; // distance from the base
        if (options.width!==null && options.width) this.width=options.width;
        else if (this.width==null) this.width=0.3;
        if (options.depth!==null && options.depth) this.depth=options.depth;
        else this.depth=0.1;
        if (options.orientationLeft) this.orientationLeft=options.orientationLeft; // displays can be slightly on the left or right
        if (options.orientationRight) this.orientationRight=options.orientationRight;
        // creates the plinth (main physical part of the display)
        this.plinth= BABYLON.MeshBuilder.CreateBox("plinth", {height: this.height, width: this.width, depth: this.depth});
        this.plinth.hidingDistance=50;
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
        this.plinthBase.isPickable=false; // only shows for 
        this.plinthBase.rotation.z=BABYLON.Tools.ToRadians(-90);
        this.plinthBase.position = new BABYLON.Vector3(this.width/2, -this.height/2, -0.35);
        this.plinthBase.material = this.styleMaterial;
        //this.plinthBase.isVisible=false; 
        // adds button to start sound file if any (see demo file) 
        if (this.sound){
            this.plinth.isVisible=true; 
            this.plinthBase.isVisible=true; 
            this.soundLinkBack = BABYLON.MeshBuilder.CreateBox("soundBack", {height:0.06,width:0.18,depth:0.02});
            this.soundLinkBack.parent = this.plinth;
            this.soundLinkBack.material=this.styleMaterial;
            this.soundLinkBack.position=new BABYLON.Vector3(0, this.height/2-0.05,-this.depth/2-0.001);
            this.soundLink = BABYLON.MeshBuilder.CreatePlane("soundButton", {height:0.06, width: 0.18, sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
            this.soundLink.parent = this.plinth;
            this.soundLink.position=new BABYLON.Vector3(0, this.height/2-0.05,-this.depth/2-0.012);
            this.soundLinkTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.soundLink,360,120);
            this.soundLinkTexture.background = "black";
            this.soundButton = BABYLON.GUI.Button.CreateSimpleButton("standWindowButton", "");
            this.soundButton.fontSize = 35;
            this.soundButton.height = "120px";
            this.soundButton.width = "360px";
            this.soundButton.fontFamily = this.fontName;
            this.soundButton.cornerRadius = 0;
            this.soundButton.color = "white";
            this.soundButton.thickness = 5;
            this.soundButton.background = "black";
            this.soundButton.textBlock.text=immersion.texts.play;
            this.soundButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            this.soundLinkTexture.addControl(this.soundButton);
            var soundLink=this.soundLink;
            var actionManager=immersion.highlight(soundLink);
            this.soundButton.onPointerUpObservable.add(function() {
                immersion.currentStand().pressSoundButton();
            });
            this.soundLinkBack.isVisible=false;
            this.soundLink.isVisible=false;
            this.soundButton.isVisible=false;
        }
        // adds a button for any action if configured (see demo file) 
        if (this.action){
            this.plinth.isVisible=true; 
            this.plinthBase.isVisible=true; 
            this.onChange = new BABYLON.Observable();
            this.actionLinkBack = BABYLON.MeshBuilder.CreateBox("actionBack", {height:0.06,width:0.18,depth:0.02});
            this.actionLinkBack.parent = this.plinth;
            this.actionLinkBack.material=this.styleMaterial;
            this.actionLinkBack.position=new BABYLON.Vector3(0, this.height/2-0.05,-this.depth/2-0.001);
            this.actionLink = BABYLON.MeshBuilder.CreatePlane("actionButton", {height:0.06, width: 0.18, sidelookingAt: BABYLON.Mesh.DOUBLESIDE});
            this.actionLink.parent = this.plinth;
            this.actionLink.position=new BABYLON.Vector3(0, this.height/2-0.05,-this.depth/2-0.012);
            this.actionLinkTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.actionLink,360,120);
            this.actionLinkTexture.background = "black";
            this.actionButton = BABYLON.GUI.Button.CreateSimpleButton("standWindowButton", "");
            this.actionButton.fontSize = 35;
            this.actionButton.height = "120px";
            this.actionButton.width = "360px";
            this.actionButton.cornerRadius = 0;
            this.actionButton.color = "white";
            this.actionButton.thickness = 5;
            this.actionButton.fontFamily = this.fontName;
            this.actionButton.background = "black";
            this.actionButton.textBlock.text=this.action;
            this.actionButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            this.actionLinkTexture.addControl(this.actionButton);
            var actionLink=this.actionLink;
            this.actionButton.stand=this;
            var actionManager=immersion.highlight(actionLink);
            var actionButton=this.actionButton;
            actionButton.onPointerUpObservable.add(function() {
                immersion.playClick();
                actionButton.stand.onChange.notifyObservers("pressed");
            });
            this.actionLinkBack.isVisible=false;
            this.actionLink.isVisible=false;
            this.actionButton.isVisible=false;
        }
        // adds window if any text
        if (this.description){
            let positionFront=0.03;
            if (this.depth>=0.3) positionFront=(this.depth/2)+0.005;
            this.standWindowBack = BABYLON.MeshBuilder.CreateBox("standWindowBack", {height:0.3,width:this.width,depth:0.05});
            this.standWindowBack.parent = this.plinth;
            this.standWindowBack.material=this.immersion.interfaceMaterial;
            /* main window */
            var standWindow = BABYLON.MeshBuilder.CreatePlane("standWindow", {height:0.3, width: this.width, sideOrientation: BABYLON.Mesh.DOUBLESIDE});
            this.standWindow=standWindow;
            this.standWindow.isPickable=true;
            this.standWindow.parent = this.plinth;
            this.standWindow.position=new BABYLON.Vector3(0, this.height/2+0.3 ,-positionFront);
            this.standWindow.applyFog=false;
            this.standWindowTitle = new BABYLON.GUI.TextBlock();
            this.standWindowTitle.text = this.title;
            this.standWindowTitle.fontFamily = this.immersion.fontName;
            this.standWindowTitle.color = "white";
            this.standWindowTitle.height = "60px";
            this.standWindowTitle.width = (300/0.3*this.width)-40+"px";
            this.standWindowTitle.lineSpacing = "5px";
            this.standWindowTitle.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            this.standWindowTitle.fontSize = 23;
            this.standWindowMessage = new BABYLON.GUI.TextBlock();
            this.standWindowMessage.fontFamily = this.immersion.fontName;
            this.standWindowMessage.text = "\n"+this.description;
            this.standWindowMessage.textWrapping=true;
            this.standWindowMessage.textVerticalAlignment="center";
            this.standWindowMessage.color = "white";
            this.standWindowMessage.height = "230px";
            this.standWindowMessage.width = (300/0.3*this.width)-40+"px";
            this.standWindowMessage.lineSpacing = "8px";
            this.standWindowMessage.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.standWindowMessage.fontSize = 16;
            this.standWindowCloseMessage = new BABYLON.GUI.TextBlock();
            this.standWindowCloseMessage.fontFamily = this.immersion.fontName;
            this.standWindowCloseMessage.text = this.immersion.texts.closeWindow;
            this.standWindowCloseMessage.textWrapping=true;
            this.standWindowCloseMessage.color = "white";
            this.standWindowCloseMessage.height = "40px";
            this.standWindowCloseMessage.width = (300/0.3*this.width)-40+"px";
            this.standWindowCloseMessage.lineSpacing = "10px";
            this.standWindowCloseMessage.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.standWindowCloseMessage.fontSize = 14;
            this.standWindowTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.standWindow,300/0.3*this.width,300);
            this.standWindowTexture.addControl(this.standWindowTitle);
            this.standWindowTexture.addControl(this.standWindowMessage);
            this.standWindowTexture.addControl(this.standWindowCloseMessage);
            this.standWindow.isVisible=false;
            this.standWindowBack.isVisible=false;
            this.standWindowBack.isPickable=false;

            if (this.windowOpened){
                this.standWindowBack.position=new BABYLON.Vector3(0, this.height/2+0.3 , 0);
                this.standWindow.scaling.y=1;
                this.standWindowTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.standWindow,300/0.3*this.width,300);
                this.standWindowTexture.addControl(this.standWindowTitle);
                this.standWindowTexture.addControl(this.standWindowMessage);
                this.standWindowTexture.addControl(this.standWindowCloseMessage);
                this.standWindowTitle.text = this.title;
                this.standWindow.position=new BABYLON.Vector3(0, this.height/2+0.3 ,-positionFront);
            }else{
                this.standWindowBack.position=new BABYLON.Vector3(0, this.height/2+0.05 , 0);
                this.standWindowBack.scaling.y=0.2;
                this.standWindow.scaling.y=0.2;
                this.standWindowTexturemin = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.standWindow,300/0.3*this.width,60);
                this.standWindowTexturemin.addControl(this.standWindowTitle);
                this.standWindowTitle.text = "⇧ "+this.title+" ⇧";
                this.standWindow.position=new BABYLON.Vector3(0, this.height/2+0.05 ,-positionFront);
            }

            var standWindow=this.standWindow;

            standWindow.stand=this;
            var actionManager=immersion.highlight(standWindow);
            actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function(ev){
                standWindow.stand.immersion.unmuteAll();
                standWindow.stand.windowSwitch();
            }));
        }
        // adds an image on the plinth if any (see demo file) 
        if (this.imageURL){
            this.plinth.isVisible=true; 
            this.plinthBase.isVisible=true; 
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
        let positionFront=0.03;
        if (this.depth>=0.3) positionFront=(this.depth/2)+0.005;
        var animationBox1 = new BABYLON.Animation("boxAnimation", "scaling.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        var animationBox2 = new BABYLON.Animation("boxAnimation2", "position.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        if (this.standWindowBack.scaling.y==1){
            this.standWindow.scaling.y=0.2;
            this.standWindowTexturemin = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.standWindow,300/0.3*this.width,60);
            this.standWindowTexturemin.addControl(this.standWindowTitle);
            this.standWindowTitle.text = "⇧ "+this.title+" ⇧";
            this.standWindow.position=new BABYLON.Vector3(0, this.height/2+0.05 ,-positionFront);
            if (this.animationActivated==false){
                this.standWindowBack.position=new BABYLON.Vector3(0, this.height/2+0.05 , 0);
                this.standWindowBack.scaling.y=0.2;
                this.standWindowTitle.text = "⇧ "+this.title+" ⇧";
            } else{
                var keys = [];
                keys.push({frame: 0,value: 1});
                keys.push({frame: 10,value: 0.2});
                var keys2 = [];
                keys2.push({frame: 0,value: this.height/2+0.3});
                keys2.push({frame: 10,value: this.height/2+0.05});
                animationBox1.setKeys(keys);
                animationBox2.setKeys(keys2);
                this.standWindowBack.animations = [];
                this.standWindowBack.animations.push(animationBox1);
                this.standWindowBack.animations.push(animationBox2);
                this.standWindow.isVisible=false;
                var standWindow=this.standWindow;
                var event = new BABYLON.AnimationEvent(10,function () {standWindow.isVisible=true;},true,);
                animationBox1.addEvent(event);
                this.standWindowBack.anim = this.immersion.beginAnimation(this.standWindowBack, 0, 10, false);
            }

        } else if (this.standWindowBack.scaling.y==0.2){
            this.standWindow.scaling.y=1;
            this.standWindowTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.standWindow,300/0.3*this.width,300);
            this.standWindowTexture.addControl(this.standWindowTitle);
            this.standWindowTexture.addControl(this.standWindowMessage);
            this.standWindowTexture.addControl(this.standWindowCloseMessage);
            this.standWindowTitle.text = this.title;
            this.standWindow.position=new BABYLON.Vector3(0, this.height/2+0.3 ,-positionFront);
            if (this.animationActivated==false){
                this.standWindowBack.position=new BABYLON.Vector3(0, this.height/2+0.3 , 0);
                this.standWindowBack.scaling.y=1;
                this.standWindowTitle.text = this.title;
            } else{
                var keys = [];
                keys.push({frame: 0,value: 0.2});
                keys.push({frame: 10,value: 1});
                var keys2 = [];
                keys2.push({frame: 0,value: this.height/2+0.05});
                keys2.push({frame: 10,value: this.height/2+0.3});
                animationBox1.setKeys(keys);
                animationBox2.setKeys(keys2);
                this.standWindowBack.animations = [];
                this.standWindowBack.animations.push(animationBox1);
                this.standWindowBack.animations.push(animationBox2);
                this.standWindow.isVisible=false;
                var standWindow=this.standWindow;
                var event = new BABYLON.AnimationEvent(10,function () {standWindow.isVisible=true;},true,);
                animationBox1.addEvent(event);
                this.standWindowBack.anim = this.immersion.beginAnimation(this.standWindowBack, 0, 10, false);
        }

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
        if (this.immersion.mute==false){
            for (const stand of this.immersion.stands) {
                if (stand.sound_data) stand.stopSound();
            }
            this.soundButton.textBlock.text=this.immersion.texts.pause;
            if (this.soundTrack==null){ // if first time playing
                this.soundTrack = new BABYLON.Sound(this.sound, this.sound_data, this.immersion, null, {
                    loop: this.loop,
                    autoplay: true,
                    spatialSound: true,
                    rolloffFactor: this.factorSound,
                    maxDistance:15
                });
                this.sound="onpress"; // doesn't play again the track automatically
                const matrix = this.plinth.computeWorldMatrix(true); 
                const soundPosition = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(this.plinth.position.x, 1.5, this.plinth.position.z), matrix); 
                this.soundTrack.setPosition(soundPosition);
                this.immersion.unmuteAll();
                this.soundTrack.immersion=this.immersion;
                this.soundTrack.onended = function() {
                    for (const stand of this.immersion.stands) {
                        if (stand.sound_data) stand.stopSound();
                    }
                }
            }else {
                this.soundTrack.play(0);
                this.immersion.unmuteAll();
            }
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
        if (options.height==null) options.height=1.25;
        if (options.depth==null) options.depth=0.3;
        if (options.distance==null) options.distance=0.7+options.depth;
        if (options.orientationPlinth!==null && options.orientationPlinth) options.distance=1.2;
        super(name,options,immersion);
        if (options.exhibit) this.exhibitMesh=options.exhibit;
        if (options.rotationE) this.rotationE=options.rotationE;
        this.plinth.isVisible=true; 
        this.plinthBase.isVisible=true; 
        var scaling=options.depth/0.05;
        if (this.standWindowBack) this.standWindowBack.scaling.z=scaling;
        // creates exhibit mesh
        if (this.exhibitMesh){
            if (this.exhibitMesh == true) this.exhibitMesh = BABYLON.MeshBuilder.CreateBox("exhibitMesh", {height: 0.2, width: 0.2, depth: 0.2});
            else this.exhibitMesh = this.exhibitMesh;
            this.exhibitMesh.parent=this.plinth;
            this.exhibitMesh.position = new BABYLON.Vector3(0, this.height/2+0.23, 0);
            this.exhibitMesh.rotation.y=BABYLON.Tools.ToRadians(90);
            if (this.rotationE==true) this.rotateExhibit();
            const matrix = this.exhibitMesh.computeWorldMatrix(true); 
            const global_position = BABYLON.Vector3.TransformCoordinates(this.exhibitMesh.position, matrix); 
            this.lookingAt.x=global_position.x;
            this.lookingAt.z=global_position.z;
        // creates a sound icon if no exhibit but some sound attached to the plinth
        }else if (this.sound){
            if (this.exhibitMesh==null && this.image==null){
                this.soundBox= BABYLON.MeshBuilder.CreateCylinder("cylinder", {diameterTop: 0.24,diameterBottom: 0.02,height:0.08});
                this.soundBox.parent=this.plinth;
                this.soundBox.material=this.styleMaterial;
                this.soundBox.position = new BABYLON.Vector3(0, this.height/2+0.18, 0);
                this.soundBall= BABYLON.MeshBuilder.CreateSphere("sphere", {diameter:0.12, slice:0.4});
                this.soundBall.parent=this.plinth;
                this.soundBall.material=this.styleMaterial;
                this.soundBall.position = new BABYLON.Vector3(0, this.height/2+0.21, 0);
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
            this.exhibitMesh.position = new BABYLON.Vector3(0, this.height/2+0.2, 0);
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
        advancedTexture1.background = "white";
        var advancedTexture2 = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(panel2,64,64);
        advancedTexture2.background = "white";
        var advancedTexture3 = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(panel3,64,64);
        advancedTexture3.background = "white";
        var advancedTexture4 = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(panel4,64,64);
        advancedTexture4.background = "white";
        var displayMessage = new BABYLON.GUI.TextBlock();
        displayMessage.fontFamily = this.immersion.fontName;
        displayMessage.textWrapping=true;
        displayMessage.text = texts[0];
        displayMessage.color = "black";
        displayMessage.fontSize = 22;
        advancedTexture1.addControl(displayMessage);
        var displayMessage2 = new BABYLON.GUI.TextBlock();
        displayMessage2.fontFamily = this.immersion.fontName;
        displayMessage2.textWrapping=true;
        displayMessage2.text = texts[1];
        displayMessage2.color = "black";
        displayMessage2.fontSize = 22;
        advancedTexture2.addControl(displayMessage2);
        var displayMessage3 = new BABYLON.GUI.TextBlock();
        displayMessage3.fontFamily = this.immersion.fontName;
        displayMessage3.textWrapping=true;
        displayMessage3.text = texts[2];
        displayMessage3.color = "black";
        displayMessage3.fontSize = 22;
        advancedTexture3.addControl(displayMessage3);
        var displayMessage4 = new BABYLON.GUI.TextBlock();
        displayMessage4.fontFamily = this.immersion.fontName;
        displayMessage4.textWrapping=true;
        displayMessage4.text = texts[3];
        displayMessage4.color = "black";
        displayMessage4.fontSize = 22;
        advancedTexture4.addControl(displayMessage4);
        return introBox;
    }
}

