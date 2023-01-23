// <TITLE> - Copyright (C) <AUTHOR(S)>, <YEAR>
// Contact details: <WEBSITE, EMAIL, ETC.>

// This immersive experience uses the Immersions library under a GNU Lesser General Public License
// and the babylon.js 3D engine under an Apache-2.0 License (https://www.babylonjs.com/).
// Unless stated otherwise, content is not open source and authors retain their copyright.
// Learn how to make your own immersion at https://bruchansky.name/immersions.

// Copy this class to create your own immersion.
class MyImmersion extends Immersion {
    constructor(engine) { 
        super("template","light",engine); 

        /*   ATMOSPHERES    */
        var groundMaterial = new BABYLON.StandardMaterial(this); 
        groundMaterial.alpha = 0.5;
        groundMaterial.diffuseColor = BABYLON.Color3.White();
        this.envOptions = new Object();
        this.envOptions.skyColor = new BABYLON.Color3(1, 1, 1); 
        this.envOptions.fogDensity = 0.01; 
        this.envOptions.fogColor = new BABYLON.Color3(1, 1, 1); 
        this.envOptions.showTitleImmersion= true; 
        this.envOptions.groundMaterial=groundMaterial; 
        this.setAtmosphere(this.envOptions,true); 

        /*   MATERIALS    */
        this.buildingMaterial = new BABYLON.StandardMaterial(this); 
        this.buildingMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        this.buildingMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);

        /*   LIGHTS    */
        var light0 =  new BABYLON.HemisphericLight("light0", new BABYLON.Vector3(0, 0, -1), this);
        light0.intensity = 0.5;
        light0.diffuse = new BABYLON.Color3(1, 1, 1);
        light0.specular = new BABYLON.Color3(0, 1, 0);

        /*   TEXTS & LINKS    */
        var textOptions = new Object();
        textOptions.title="My Immersion";
        textOptions.author="My Name"; 
        textOptions.about="Welcome to this immersion (short text)."; 
        textOptions.introduction="About this immersion (long text)."; 
        textOptions.aboutTextButton="About"; 
        textOptions.aboutLink="https://bruchansky.name/"; /* your website link */
        textOptions.exitTextButton="Art"; 
        textOptions.exitLink="https://bruchansky.name/digressions"; 
        this.addTexts("en",textOptions);

        /*   STANDS    */
        var standsOptions = new Object();
        standsOptions.exitPosition=new BABYLON.Vector3(0,0,10); 
        standsOptions.exitAngle=0; 
        this.initiateStands(standsOptions); 

        var sphere = BABYLON.MeshBuilder.CreatePolyhedron("sphere", {size:0.1,type:4});
        sphere.material=this.buildingMaterial;
        var exhibit1 = new Plinth ("exhibit1",{
            rotationE: true,
            exhibit: sphere,
            text: this.texts.exhibit, 
            title:"Art Exhibit",
            description:"This is Exhibit #1.",
            position: new BABYLON.Vector3(0,0,0),
            lookingAt: new BABYLON.Vector3(0,1.5,1),
            style:"dark",
        },this);
        this.addStand(exhibit1);
        
        this.activateNavigation(); 

        /*   ASSETS    */

    };
}
