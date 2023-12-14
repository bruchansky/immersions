// <TITLE> - Copyright (C) <AUTHOR(S)>, <YEAR>
// Contact details: <WEBSITE, EMAIL, ETC.>

// This immersive experience uses the Immersions library under a GNU Lesser General Public License
// and the babylon.js 3D engine under an Apache-2.0 License (https://www.babylonjs.com/).
// Unless stated otherwise, content is not open source and authors retain their copyright.
// Learn how to make your own immersion at https://bruchansky.name/immersions.

/* General information */
// x axe goes right, y axe goes up, z axe goes forward
// Rotations are counterclockwise
// Immersions are 500x500m2
class MyImmersion extends Immersion {
    constructor(engine) { 
        super("demo","light",engine); // name and style of your immersion: either "light" or "dark" (default)

        /*   ATMOSPHERES    */
        // Sky and ground settings that can be activated by stands
        var groundMaterial = new BABYLON.StandardMaterial(this); // custom ground material
        groundMaterial.alpha = 0.5;
        groundMaterial.diffuseColor = BABYLON.Color3.White();
        this.envOptions = new Object();
        this.envOptions.skyColor = new BABYLON.Color3(0.701, 1, 0.996); 
        this.envOptions.fogDensity = 0.1; 
        this.envOptions.fogColor = new BABYLON.Color3(0.878, 0.996, 1); 
        this.envOptions.showTitleImmersion= true; // displays or not the immersion title on the sky, default is true
        this.envOptions.groundMaterial=groundMaterial; 
        this.envDesert = new Object();
        this.envDesert.skyColor = new BABYLON.Color3(1, 1, 1); 
        this.envDesert.fogDensity = 0.05; 
        this.envDesert.fogColor = new BABYLON.Color3(0.941, 0.772, 0.239);
        this.envNight = new Object();
        this.envNight.skyColor = new BABYLON.Color3(1, 1, 1); 
        this.envNight.fogDensity = 0.05; 
        this.envNight.fogColor = new BABYLON.Color3(0.407, 0.592, 0.992);
        this.setAtmosphere(this.envOptions,true); // sets the default atmosphere 

        /*   MATERIALS    */
        // Materials used in your immersion (see babylonjs material documentation)
        this.sphere1Material = new BABYLON.StandardMaterial(this); 
        this.sphere1Material.diffuseColor = new BABYLON.Color3(0.156, 0.843, 0.721);
        this.sphere1Material.ambientColor = new BABYLON.Color3(0.156, 0.843, 0.721);
        this.buildingMaterial = new BABYLON.StandardMaterial(this); 
        this.buildingMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.buildingMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
        this.wireframeMaterial = new BABYLON.StandardMaterial(this); 
        this.wireframeMaterial.wireframe = true;
        this.wireframeMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.wireframeMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
        // makes meshes that include "neon" in their name glow
        this.gl = new BABYLON.GlowLayer("glow", this);
        this.gl.customEmissiveColorSelector = function(mesh, subMesh, material, result) {
            if (mesh.name.includes("neon")) {
                result.set(1, 1, 1, 1);
            }else {
                result.set(0, 0, 0, 0);
            }
        };

        /*   LIGHTS    */
        // Lights used in your immersion (see babylonjs light documentation)
        var light0 =  new BABYLON.HemisphericLight("light0", new BABYLON.Vector3(0, 0, -1), this);
        light0.intensity = 0.5;
        light0.specular = new BABYLON.Color3(1, 0.607, 0.2); // highlight color
        light0.diffuse = new BABYLON.Color3(1, 1, 1); // surrounding color
        light0.groundColor = new BABYLON.Color3(0, 0, 1); // when hidden from the light
        var light1 = new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(-2,-1,-1), this); // direction of the light 
        light1.intensity=3;
        light1.diffuse = new BABYLON.Color3(0.415, 0.894, 0.345);
        light1.specular = new BABYLON.Color3(0.415, 0.894, 0.345);
        var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-0.5,-1,2), this);
        light2.intensity=2;
        light2.diffuse = new BABYLON.Color3(0.894, 0.345, 0.345);
        light2.specular = new BABYLON.Color3(0.894, 0.345, 0.345);

        /*   TEXT & LINKS    */
        // Texts and links used in your immersion, in several languages if you wish
        // Stand windows can fit about 200 characters 
        // Stand window titles can fit about 20 characters
        var textOptionsEN = new Object();
        textOptionsEN.title="My Immersion"; // default is "Title"
        textOptionsEN.author="My Name"; // default is "Author" (displayed under title)
        textOptionsEN.about="Welcome to this immersion demo."; // Text displayed on the first welcoming stand
        textOptionsEN.aboutTextButton="About"; // used in the top right menu and at the end of the immersion, default is "About"
        textOptionsEN.aboutLink="https://bruchansky.name/"; // your website link
        textOptionsEN.exitTextButton="Art"; // second button/stand that you can customise at the end of the immersion
        textOptionsEN.exitLink="https://bruchansky.name/digressions"; 
        textOptionsEN.fullLink="https://bruchansky.name/plastic"; // url used in preview mode (dest parameter) to explore full experience
        textOptionsEN.viewpoint="View-\npoint"; // suggested text for simple stands
        textOptionsEN.audio="Audio\nStand"; //  suggested text for audio stands
        textOptionsEN.text="Text\nDisplay"; //  suggested text for displays
        textOptionsEN.exhibit="Exhibit"; //  suggested text for plinths
        textOptionsEN.gate="Gate"; //  suggested text for gates
        textOptionsEN.action="Inter\naction"; // suggested text for interactive displays
        this.addTexts("en",textOptionsEN);
        var textOptionsFR = new Object();
        textOptionsFR.title="Mon immersion"; 
        textOptionsFR.author="Mon nom"; 
        textOptionsFR.about="Bienvenue dans cette immersion."; 
        textOptionsFR.aboutTextButton="À\npropos"; 
        textOptionsFR.aboutLink="https://bruchansky.name/fr"; 
        textOptionsFR.exitTextButton="Art"; 
        textOptionsFR.exitLink="https://bruchansky.name/digressions"; 
        this.addTexts("fr",textOptionsFR); // to test, add "&lang=fr" in your url or as a parameter of your immersion

        /*   STANDS    */

        // Stands are navigation elements, they can be viewpoints, plinths, text displays, etc.
        // Introduction and exit stands are added automatically to your immersion.
        // Introduction stands are always located at the same location: (0,0,-175).
        // Position and angle of exit stands are configurable.
        var standsOptions = new Object();
        standsOptions.exitPosition=new BABYLON.Vector3(53,0,140); // where the exit stands are located
        standsOptions.exitAngle=20; // angle in degrees of the exit stands  (0 is in front, clockwise)
        standsOptions.exitAtmosphere=this.envNight; // sets atmosphere for exit stands
        this.initiateStands(standsOptions); 

        // Add here all your stands, their order will determine the order of the user navigation

        // Simple viewpoint without text
        var first = new Stand ("first",{
            atmosphere: this.envDesert, // atmospheres can change based on the current stand 
            position: new BABYLON.Vector3(-50,0,-100),
            lookingAt: new BABYLON.Vector3(-50.1,1.7,-99), // direction the camera looks at (what's in front of you)
            style:"light", // style of the stand ("ligh","dark" or "wireframe")
        },this);
        this.addStand(first);

        // Simple viewpoint with text
        var viewpoint = new Stand ("viewpoint",{
            text: this.texts.viewpoint, // recommended text for viewpoints (appears on signs)
            lineFrom:"first",
            atmosphere: this.envDesert,
            position: new BABYLON.Vector3(-50.5,0,-95),
            lookingAt: new BABYLON.Vector3(-50.4,1.7,-94)
        },this);
        this.addStand(viewpoint);

        // Simple display with an image and window
        var imageIntro="/immersion_demo/rock.jpg";
        var imageStand = new Display ("imageStand",{
            image:imageIntro,
            text:this.texts.text, //recommended text for simple displays (appears on signs)
            lineFrom:"viewpoint", // draws a line between two stands (optional)
            title: "Simple Display",
            description: "This is a simple display with an image and some description.",
            position: new BABYLON.Vector3(-49,0,-88),
            lookingAt: new BABYLON.Vector3(-49,1.42,-87),
            atmosphere: this.envDesert
        },this);
        this.addStand(imageStand);

        // Interactive display 
        var buttonDisplay = new Display ("buttonDisplay",{
            action: "Press here", // text displayed on the action button
            text: "Play", 
            title:"Point and Clicks",
            description:"Point and click the stones for some default interactions. Press the button to change their shape.",
            windowOpened: true, // opens the window by default
            lineFrom:"imageStand",
            position: new BABYLON.Vector3(-50,0,-80),
            lookingAt: new BABYLON.Vector3(-50,1.5,-79),
            atmosphere: this.envDesert
        },this);
        this.addStand(buttonDisplay);

        // Add this function to attach an action to a display
        buttonDisplay.onChange.add(function(value) {  
            // See spheres created at the end of this file
            for (let c = 0; c <spheres.length ; c++) {
                let r1=Math.random()+0.5;  
                let r2=Math.random()+0.5;  
                let r3=Math.random()+0.5;  
                spheres[c].scaling=new BABYLON.Vector3(r1,r2,r3)
            }
        })

        // Sound display 
        var soundDisplay = new Display ("soundDisplay",{
            sound: "autoplay", // "autoplay" = plays automatically when coming to the stand, "onpress" = plays only when pressing the sound button
            loop: false, // default is false 
            factorSound: 1, // configures how far the sound can be heard from, see babylonjs documentation
            text: this.texts.audio, 
            windowOpened: false,
            title:"Sound Display",
            description:"This sound is automatically played when you arrive. You can stop it and replay it afterwards.",
            position: new BABYLON.Vector3(-48,0,-65),
            lookingAt: new BABYLON.Vector3(-48.25,1.5,-64),
            atmosphere: this.envDesert
        },this);
        this.addStand(soundDisplay);

        // This is how to load a sound file and attach it to a stand
        var loading_sound1 = this.assetsManager.addBinaryFileTask("sound1","/immersion_demo/welcome.mp3");
        loading_sound1.onSuccess = function(task) {soundDisplay.loadSound(task.data);};

        // Simple display 
        var captionStand = new Display ("captionStand",{
            text:this.texts.text,
            title:"Gate",
            description: "There are two types of gates: gates opening a link (left) and gates teleporting users to another location in the immersion (right).",
            atmosphere: this.envDesert,
            lineFrom:"soundDisplay",
            position: new BABYLON.Vector3(-50.5,0,-55),
            lookingAt: new BABYLON.Vector3(-50.5,1.42,-54),
            style:"wireframe" 
        },this);
        this.addStand(captionStand);

        // Gate
        var regularGate = new Gate ("regularGate",{
            gate: "exhibitPlinth", // name of the stand the gate will teleport users to
            text: this.texts.gate, 
            position: new BABYLON.Vector3(-49.5,0,-45),
            lookingAt: new BABYLON.Vector3(-49,1.5,-44),
            atmosphere: this.envDesert,
            style:"wireframe"
        },this);
        this.addStand(regularGate);

        // Link
        var regularLink = new Link ("regularLink",{
            gate: "https://bruchansky.name", // link that the gate will open
            text: "Link", 
            position: new BABYLON.Vector3(-51.5,0,-45),
            lookingAt: new BABYLON.Vector3(-51.5,1.5,-44),
            atmosphere: this.envDesert,
            style:"wireframe"
        },this);
        this.addStand(regularLink);

        // Plinth with exhibit 
        var exhibitPlinth = new Plinth ("exhibitPlinth",{
            exhibit: true, // adds a box as a placeholder until the exhibit is loaded
            text: "#1", 
            title:"Exhibit #1",
            description:"This is a 3D scan imported in the immersion.",
            position: new BABYLON.Vector3(52,0,90),
            lookingAt: new BABYLON.Vector3(52,1.4,91), // plinths have always the camera looking at the center of their exhibit (52 and 91 are overwritten)
            atmosphere: this.envNight,
            style:"dark",
        },this);
        this.addStand(exhibitPlinth);

        var immersion=this;
        // this is how to load a 3D scan in babylonjs
        var loading_rock = this.assetsManager.addMeshTask("loading_rock", "", "/immersion_demo/rock/", "textured.obj");
        loading_rock.onSuccess = function (task) {
            var rock1 = task.loadedMeshes[0].clone();
            rock1.scalingDeterminant=0.15;
            rock1.rotationQuaternion = null;
            rock1.position=new BABYLON.Vector3(0,-0.115,-0.01);
            rock1.hidingDistance=20; // displays the rock only when closer to 20 meters (to improve performance)
            exhibitPlinth.setExhibit(rock1);
            var rock2 = task.loadedMeshes[0]; // add another rock in the scene
            rock2.scalingDeterminant=2;
            rock2.rotationQuaternion = null;
            rock2.position=new BABYLON.Vector3(-54,0.5,-83);
        };

        // Plinth with exhibit, window, image and sound
        let spherePlinth = BABYLON.MeshBuilder.CreatePolyhedron("sphere-neon", {size:0.1,type:4});
        spherePlinth.material=this.wireframeMaterial;
        var imageIntro="/immersion_demo/immersions.jpg";
        var fullPlinth = new Plinth ("fullPlinth",{
            image:imageIntro, 
            sound: "autoplay",
            rotationE: true, // rotates the exhibit 
            loop: false, 
            exhibit: spherePlinth, // directly adds an exhibit to a stand (if it doesn't need to be loaded from an external file)
            text: "#2", 
            title:"Exhibit #2",
            description:"You can also add simple meshes to a plinth, add a sound and an image.",
            atmosphere: this.envNight,
            position: new BABYLON.Vector3(51,0,100),
            lookingAt: new BABYLON.Vector3(51,1.5,101),
            style:"dark",
        },this);
        this.addStand(fullPlinth);

        var loading_sound2 = this.assetsManager.addBinaryFileTask("sound2","/immersion_demo/art.mp3");
        loading_sound2.onSuccess = function(task) {fullPlinth.loadSound(task.data);};

        // Custom size plinth 
        var customPlinth = new Plinth ("customPlinth",{
            width: 0.8,
            depth: 0.4,
            height: 1.2,
            distance: 1.8, // distance between the plinth and the base
            exhibit: true,
            text: "#3", 
            title:"Exhibit #3",
            description:"You can also create 3D models in VR and import them.",
            position: new BABYLON.Vector3(53,0,110),
            lookingAt: new BABYLON.Vector3(53,1.5,111),
            atmosphere: this.envNight,
            style:"dark",
        },this);
        this.addStand(customPlinth);

        var immersion=this;
        // this is how to load a 3D model in babylonjs
        var loading_model= this.assetsManager.addMeshTask("loading_model", "", "/immersion_demo/model/", "scene.gltf");
        loading_model.onSuccess = function (task) {
            var model = task.loadedMeshes[0];
            model.scalingDeterminant=1.5;
            model.rotationQuaternion = null;
            model.rotation.y  =  BABYLON.Tools.ToRadians(90);
            model.position=new BABYLON.Vector3(0,0,0);
            customPlinth.setExhibit(model);
        };

        // Sound Plinth (will add automatically a speaker shape)
        var soundPlinth = new Plinth ("soundPlinth",{
            sound: "autoplay",
            orientationLeft: 0.05,
            text: this.texts.audio, 
            title:"Sound Plinth",
            description:"Particles appear when the sound is playing.",
            atmosphere: this.envNight,
            position: new BABYLON.Vector3(49,0,120),
            lookingAt: new BABYLON.Vector3(49,1.4,121),
            style:"dark",
        },this);
        this.addStand(soundPlinth);

        var loading_sound3 = this.assetsManager.addBinaryFileTask("sound3","/immersion_demo/open.mp3");
        loading_sound3.onSuccess = function(task) {soundPlinth.loadSound(task.data);};

        // Carousels are plinths with some eye-catching text
        let carouselText = ["Art","VR","Open","Free"]; 
        var carousel = new Carousel ("carousel",{
            carousel:carouselText,
            rotationE:true,
            text: "More", 
            title:"Carousel",
            height: 1.42,
            description:"Next are examples of artistic immersions, more info about the open source project and its creator.",
            atmosphere: this.envNight,
            position: new BABYLON.Vector3(50,0,130),
            lookingAt: new BABYLON.Vector3(50,1.5,131),
            style:"dark",
        },this);
        this.addStand(carousel);

        this.activateNavigation(); // to activate the stands 

        
        /*   ASSETS    */

        // this is how to create a wall using the earcut library
        const myShape = [
            new BABYLON.Vector3(-58.5,0,-91),
            new BABYLON.Vector3(-54,0,-91),
            new BABYLON.Vector3(-54,0,-100),
            new BABYLON.Vector3(-53.5,0,-100),
            new BABYLON.Vector3(-53.5,0,-90),
            new BABYLON.Vector3(-58,0,-90),
            new BABYLON.Vector3(-58,0,-60),
            new BABYLON.Vector3(-58.5,0,-60),
        ];
        var wall = BABYLON.MeshBuilder.ExtrudePolygon("wall", {shape: myShape, depth: 3}, this);
        wall.position.y = 3;
        wall.material=this.buildingMaterial;

        // this is how to create simple animations in babylonjs
        const rotationAnim = new BABYLON.Animation("rotationAnim", "rotation.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        const rotationAnim2 = new BABYLON.Animation("rotationAnim2", "rotation.x", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        const keys = []; 
        keys.push({frame: 0,value: 0});
        keys.push({frame: 300,value: 2 * Math.PI});
        rotationAnim.setKeys(keys);
        rotationAnim2.setKeys(keys);
        let sphere = BABYLON.MeshBuilder.CreatePolyhedron("sphere-neon", {size:7,type:3}); // giant sphere appearing at the entrance
        sphere.material=this.wireframeMaterial;
        sphere.position=new BABYLON.Vector3(0,8,-140);
        sphere.animations = [];
        sphere.animations.push(rotationAnim);
        sphere.animations.push(rotationAnim2);
        sphere.anim = this.beginAnimation(sphere, 0, 600, true);

        // Stones appearing in the interactive part of the immersion
        var spheres = [];
        for (let c = 0; c <3 ; c++) {
            let sphere = BABYLON.MeshBuilder.CreatePolyhedron("sphere", {size:0.3,type:3});
            sphere.material=this.sphere1Material.clone();
            sphere.position=new BABYLON.Vector3(c-51,1.8,-77);
            sphere.animations = [];
            sphere.animations.push(rotationAnim);
            sphere.animations.push(rotationAnim2);
            sphere.anim = this.beginAnimation(sphere, 0, 600, true);

            spheres.push(sphere);
        }
        // to make spheres 2 and 3 appear/disappear when clicking on the first (appear by default)
        this.disappearOnClick(spheres[0], new Array(spheres[1],spheres[2]), true); 
        // to pause/resume animations on click
        // false to pause the animation by default
        // 'whiter'is the style for rollovers (optional parameter, default is a wireframe style)
        this.pauseOnClick(spheres[1], spheres[1].anim,false,'whiter');
        this.pauseOnClick(spheres[2], spheres[2].anim,true);

        // This is how to add background sounds to your immersion
        var immersion=this;
        var bg = this.assetsManager.addBinaryFileTask("bg","/immersion_demo/bg.m4a");
        bg.onSuccess = function(task) {
            immersion.addSound(task.data,new BABYLON.Vector3(-50,1.5,-77),400) // parameters: sound data, origin of the sound, how far the sound is heard from
        };

    };

}
