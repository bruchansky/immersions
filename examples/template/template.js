// See immersion_engine/examples/demo/demo.js for usage of all engine methods and patterns.

class MyImmersion extends Immersion {
  constructor(engine) {
    const config = {
      viewHeight: 1.75,
      skyColor: new BABYLON.Color3(0.8, 0.9, 1.0),
      fogDensity: 0.005,
      groundSize: 200,
    };
    super("myImmersion", "light", engine, config);

    // -- Lights --
    var light0 = new BABYLON.HemisphericLight("light0", new BABYLON.Vector3(0, 1, 0), this);

  }

  async init() {
    // Fetch JSON data and import stands + texts.
    // See immersion_engine/examples/demo/demo.json for the full JSON format and all stand types.
    const response = await fetch("/immersion_engine/examples/template/template.json");
    const data = await response.json();
    this.importData(data);
  }

}
