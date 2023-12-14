# Immersions (3D & VR Library)
<p align="center">
  <img width="830px" src="https://github.com/bruchansky/immersions/blob/main/docs/demo.jpg">
</p>

The Immersion open source library allows anyone with basic javascript knowledge to create immersive experiences in virtual reality and on the Web. It is based on [WebXR](https://immersiveweb.dev/) and uses the [babylon.js](https://www.babylonjs.com/) real time 3D engine.

The indie project was developed as part of a [platform](https://bruchansky.name/immersions/) dedicated to immersive art on the web (January 2021). I didn’t want to rely on commercial spaces for my artworks, and to be restricted by game and artificial scarcity mechanics found on other VR platforms.

Since then, I keep updating the engine based on my own artistic needs, and everyone is welcomed to contribute.

I believe the web is still the best metaverse out there: it is free and without any restrictions.

Features:

* **Point and Click Navigation**:create viewpoints, add 3D exhibits, text and audio to tell your story.

* **Cross-platform**:works from most browsers on mobile, desktop and virtual reality headsets (tested on Meta Quest 2 and Pico).

* **Open Source**: you own and retain full control over your virtual space. The library is based on WebXR open standards and the babylon.js real time 3D engine.

* **Ease of Use**:comes with a step-by-step guide on how to build your project from scratch using Blender, Gravity Sketch, Mixamo and Polycam.

* **Boundless**: whether you are an artist, architect or designer, the only limit is your imagination.


Please feel free to [ask me any question](https://github.com/bruchansky/immersions/discussions) or [request new features](https://github.com/bruchansky/immersions/issues). And let me know about your immersions!

* **Demo:** [**https://bruchansky.name/immersion_demo**](https://bruchansky.name/immersion_demo)

* **Template:** [**https://bruchansky.name/immersion_template**](https://bruchansky.name/immersion_template)

* **Art projects based on the library:** [**https://bruchansky.name/immersions/**](https://bruchansky.name/immersions/)

## License 

This library is free to use and under a GNU Lesser General Public License (the babylon.js engine is itself under an Apache-2.0 License).

This way, you can use it for your immersive experiences and retain full control over your creative and artistic work (commercial and non-commercial).

Please credit the library and babylon.js in your source files (see [template](https://github.com/bruchansky/immersions/blob/main/template/immersion.js) header, LICENSE & COPYING.LESSER files), and keep the "Open Source" gate and button in the user interface so that others can discover the library.

## Installation 

1.  Download all folders:
    * The immersion\_engine is where the immersion library and all assets are.
    * The template folder is the one to edit in order to create your immersion.
    * The demo folder is where you’ll find documented examples on how to use the immersion library. 
2.  Install a web server on your local machine so that you can test your immersion. I personally use Python [SimpleHTTPServer](https://www.linuxjournal.com/content/tech-tip-really-simple-http-server-python). 
3.  Start your local server: open a terminal window (I use [iTerm2](https://iterm2.com/) on Mac and Windows Terminal on Windows), go to the directory where you've downloaded the 3 subfolders, and start your server with the following command: “python3 -m http.server 9000” (might be another port).
4.  Open your browser (chrome for instance) and test the downloaded template: localhost:9000/immersion_template/index.html.
5.  Run the demo: localhost:9000/immersion_demo/index.html.
6.  Both should look the same than on the two urls provided above.
7.  That’s it, everything is installed and you’re ready to develop.

## How to use the immersion engine

*   On chrome, use the [developer console](https://balsamiq.com/support/faqs/browserconsole/#:~:text=To%20open%20the%20developer%20console,(on%20Windows%2FLinux).) to debug your immersion (with [cache disabled](https://www.webinstinct.com/faq/how-to-disable-browser-cache#:~:text=When%20you're%20in%20Google,close%20out%20of%20Developer%20Tools.) so that you always test the latest version).
*   If the immersion takes a lot of your CPU, reduce the size of your browser’s window.
*   You can configure the following parameters of the immersion engine either by editing the index.html (see example in the demo) or by passing them in the URL:
    *   "lang" parameter is for the language ("en" by default).
    *    "mode" parameter is for the navigation mode:
        *   'arc' is the default navigation.
        *   'dvp' is a universal camera navigation with extra information for development (camera and mesh positions, babylonjs debug console).
        *    'screenshot' mode hides all stands, useful for video and image captures.
    *   "mute" parameter is false by default, useful when developing.
    *   "dest" parameter is like an html anchor but in 3D spaces, it goes directly to the stand with that name. This mode is optimised for screen previews (no navigation, bigger buttons, camera rotating aound the destination)

## Create your 3D assets

Here are some tips on how to easily create your digital assets. 

*   If you publish your immersion online (which I hope you will), keep an eye on the total size of your assets. My recommendation is to not exceed 20Mb. 
*   To create 3D models, the standard is the [Blender](https://www.blender.org/) open source software. But I personally prefer to create 3D models directly in virtual reality using softwares such as [Gravity Sketch](https://www.gravitysketch.com/)\* on the Meta Quest. You can also download free 3D models on platforms such as [Sketchfab](https://sketchfab.com/).
*   For animations, I use [Mixamo](https://www.mixamo.com/). In Gravity Sketch, export your model to .fbx format -> import it in Mixamo -> add your animation and download the .fbx file -> import it in Blender and export it in the .glb format.
*   I personally use [Polycam](https://poly.cam/) for 3D scans. Don’t expect perfect results but it’s still impressive, and you can make a limited number of free scans. Export your scan to the obj format, preferably in the reduced size to optimise download speed.
*   For soundtracks, I mix ready-made loops from [GarageBand](https://www.apple.com/mac/garageband/) on iOS.
*   For audio voices, I use text to speech online tools such as this [one](https://freetts.com/). You’ll find many online, and they usually come with free trials.
   
<p align="center">
  <img width="830px" src="https://github.com/bruchansky/immersions/blob/main/docs/example-art.jpg">
</p>
<p align="center"><i>Example of immersion using 3D assets ("<a href="https://immersions.art/constructions" target="_blank">Constructions</a>")</i></p>

## Make your Own Immersion

Now that you have installed the immersion engine and have created your 3D assets, it’s time to bring everything together.

Immersions are composed of reusable navigation elements called “stands”. Stands allow visitors to interact with their environment whether in virtual reality, on desktop, mobile or tablet. Immersions will automatically display a user interface on mobile or desktop, and will handle most common VR navigation. So that you can focus on the point and click experience you want to create, and not think too much about engine setup or navigation. 
   
<p align="center">
  <img width="830px" src="https://github.com/bruchansky/immersions/blob/main/docs/immersions-features.jpg">
</p>

All stands can be created in just two lines:

```javascript
var stand = new Stand ("name",{options},myImmersion);
myImmersions.addStand(stand);
```

Here are the different types of stands you can create, all are documented in the demo file:
```
“Stands” are the simplest ones, they are like viewpoints: 
  a simple way for visitors to move around in your immersion.

--> “Gates” are stands that teleport visitors to another location (another stand) in your immersion.
  They are useful for large immersions (up to 500x500 m2).
  
--> “Links” are stands that open external links.
  
--> “Displays” are stands that display texts and images, 
  can play sounds or perform configurable actions.

-----> “Plinths” are displays for 3D models.

----------> “Carousels” are plinths that display some eye-catching text.
```

Stands are developed as javascript classes to make it easy to extend them and create new reusable ones.

Now, here is how to create your immersion:

*   Clone the template folder, rename it as you wish and start editing the immersion.js file inside. I personally use [VStudio](https://visualstudio.microsoft.com/) to edit files.
*   Use the immersion.js file inside the demo folder as your main reference for documentation. You’ll find inside:
    *   Examples of all stands with some explanation on how to use them. Copy and paste the ones you would like to use and configure. Use the ‘dvp’ mode to navigate your immersion and decide where to position your stands.
    *   Examples on how to set the scene, sky, ground, lights and sounds.
    *   Some basic examples on how to import your 3D assets. 
*   You’ll probably need to use the [babylon.js documentation](https://doc.babylonjs.com/). All babylon.js features can be used within immersions, and their explanation is usually very good.
*   Regularly test your immersion in your browser. And when you are ready, publish it online so that you could test it on your virtual headset. 

## Contributing

If you would like to contribute or request a feature, please use the [Github issues board](https://github.com/bruchansky/immersions/issues). And feel free to send feedback or ask questions in the [discussions](https://github.com/bruchansky/immersions/discussions) section.

No automated test is implemented yet, but all use cases are included in the demo. The best way to make sure your contribution isn't breaking anything is to run the demo.

My priority is to build a library that is easy to use, with some clean classes and functions to call. Please let me know if you believe something fundamental should change in the way it is used in the demo or template.

What is inside classes and functions is probably not as clean. Hopefully, the code is still readable and can be extended in a clean fashion.
  
Enjoy!
