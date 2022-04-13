# Immersions (VR Library)
<p align="center">
  <img src="https://github.com/bruchansky/immersions/blob/main/docs/demo.jpg">
</p>

The Immersion open source library allows anyone with basic knowledge of javascript to create immersive experiences in virtual reality and on the Web. It is based on [WebXR](https://immersiveweb.dev/) and uses the [babylon.js](https://www.babylonjs.com/) real time 3D engine.

I initially developed the library for my immersive art projects. But it can also be used for simulations, games, and any immersive experience you want. I keep updating the engine based on my personal artistic needs, and everyone is welcomed to contribute.

I started the indie project in December 2021. I didn’t want to depend on commercial virtual spaces for my artistic creations. I didn’t want to be restricted by game and artificial scarcity mechanics found on other VR platforms. I believe the web is still the best metaverse out there: anybody can publish on it and it can now deliver truly immersive experiences.

Please feel free to [ask me any question](https://github.com/bruchansky/immersions/discussions) or [request new features](https://github.com/bruchansky/immersions/issues). And let me know about your immersions!


* **Project homepage:** [**https://bruchansky.name/immersions-vr-library/**](https://bruchansky.name/immersions-vr-library/)

* **Demo:** [**https://immersions.art/demo**](https://immersions.art/demo)

* **Template:** [**https://immersions.art/template**](https://immersions.art/template)

* **Art projects based on the library:** [**https://immersions.art**](https://immersions.art)

<p align="center">
  <img src="https://github.com/bruchansky/immersions/blob/main/docs/demo-rock.jpg">
</p>
<p align="center"><i>3D scan of a rock inside the demo</i></p>


Try these urls on mobile, desktop and with your virtual headset. I’ve performed most tests on the Meta Quest 2 headset, but immersions should also work on other virtual headsets.

Google cardboards are not supported though because of their specific navigation. But it is perfectly feasible, and I’ve added the feature in [future improvements](https://github.com/bruchansky/immersions/issues).

## License 

This library is free to use and under a GNU Lesser General Public License (the babylon.js engine is itself under an Apache-2.0 License).

This way, you can use it for your immersive experiences, retain your copyright and keep full control over your creative and artistic work (commercial and non-commercial).

The only condition is that you credit the library and babylon.js in your source files (see template header, LICENSE & COPYING.LESSER files), and that you keep the "Open Source" button and VR stand in the user interface.

## Installation 

1.  Download the src folder and rename it as you wish, let’s call it ‘vr’ in our example. The folder includes:
    * The immersion\_engine where the immersion library and all engine assets are.
    * The template folder: this is the one to edit in order to create your immersion.
    * The demo folder: this is where you’ll find all documented examples on how to use the immersion engine. 
2.  Install a web server on your local machine so that you can test your immersion. I personally use Python [SimpleHTTPServer](https://www.linuxjournal.com/content/tech-tip-really-simple-http-server-python) because it is the easiest to install. 
3.  Start your local server: open a terminal window (I use [iTerm2](https://iterm2.com/) on Mac), move to where the vr folder is located on your machine (cd whereyourfolderis/vr), and start your server with the following command: “python3 -m http.server 9000” (might be another port).
4.  Open your browser (chrome for instance) and test that your template works: localhost:9000/whereyourfolderis/vr/template/index.html.
5.  Do the same for the demo: localhost:9000/<whereyourfolderis>/vr/demo/index.html.
6.  Both should look the same than on the two urls at the top of this page.
7.  If both work as expected, that’s it, everything is installed and you’re ready to develop.

## How to use the immersion engine

*   On chrome, use the [developer console](https://balsamiq.com/support/faqs/browserconsole/#:~:text=To%20open%20the%20developer%20console,(on%20Windows%2FLinux).) to debug your immersion (with [cache disabled](https://www.webinstinct.com/faq/how-to-disable-browser-cache#:~:text=When%20you're%20in%20Google,close%20out%20of%20Developer%20Tools.) so that you always test the latest version).
*   If the immersion takes a lot of your CPU, reduce the size of your browser’s window.
*   You can configure the following parameters of the immersion engine either by editing the index.html (see example in the demo) or by passing them in the URL:
    *   "lang" parameter is the language ("en" by default).
    *    "mode" parameter is the navigation mode:
        *   'arc' is the default navigation.
        *   'dvp' is a universal camera navigation with information for development such as current position and positions of each mesh (displayed in the development console).
        *    'capture' mode hides all stands, useful for for video and image captures.
    *   "mute" parameter is false by default, useful when developing.
    *    "dest" parameter is like an html anchor but in VR, it goes directly to the stand with the name specified (to be used only for development atm).

## Create your 3D assets

Before describing how to develop your immersion, here are some tips on how to easily create your digital assets. All tools below can be used for free. Think outside the box and don’t limit yourself to virtual twins. Virtual possibilities are endless! 

*   If you publish your immersion online (which I hope you will), keep an eye on the total size of your assets. My recommendation is to not exceed 20Mb, otherwise the immersion can be very slow to download on some mobile networks. 
*   To create 3D models, the standard is the [Blender](https://www.blender.org/) open source software. But I personally prefer to create 3D models directly in virtual reality using softwares such as [Gravity Sketch](https://www.gravitysketch.com/)\* on the Meta Quest 2. You can also download free 3D models on platforms such as [Sketchfab](https://sketchfab.com/).
*   Many 3D scan solutions exist. I personally use [Polycam](https://poly.cam/) on my Android phone. Don’t expect perfect results but it’s still impressive, and you can make a limited number of free scans. Export your scan in the obj format, preferably in the reduced size to optimise download speed.
*   For soundtracks, I mix ready-made loops from [GarageBand](https://www.apple.com/mac/garageband/) on iOS. You can also create original tracks with it, but the choice of loops is huge and they do the job.
*   For audio voices, I use text to speech online tools such as this [one](https://freetts.com/). You’ll find many online, and they usually come with free trials.

\* For Gravity Sketch models, I download them first as obj files. I import them in Sketchfab. I make some final material adjustments and export them in the gltf format. Each layer can be retrieved separately with babylon.js.
   
<p align="center">
  <img src="https://github.com/bruchansky/immersions/blob/main/docs/example-art.jpg">
</p>
<p align="center"><i>Example of immersion using 3D assets ("<a href="https://immersions.art/constructions" target="_blank">Constructions</a>")</i></p>

## Make your Own Immersion

Now that you have installed the immersion engine and have created your 3D assets, it’s time to bring everything together.

Immersions are composed of reusable navigation elements called “stands”. Stands allow visitors to interact with their environment whether in virtual reality, on desktop, mobile or tablet. Immersions will automatically display a user interface if you’re on mobile or desktop, and will handle the most widespread ways to navigate in VR. So that you can focus on the experience you want to create, and not think about engine setup or navigation. 
   
<p align="center">
  <img src="https://github.com/bruchansky/immersions/blob/main/docs/immersions-features.jpg">
</p>

All stands can be created in just two lines:

```javascript
var stand = new Stand ("name",{options},myImmersion);
myImmersions.addStand(stand);
```

Here are all the different types of stands you can create, all are documented in the demo file:
```
“Stands” are the simplest ones, they are like viewpoints: 
  a simple way for visitors to move around in your immersion.

--> “Gates” are stands that teleport visitors to another location (another stand) in your immersion.
  They are useful for large immersions (they can be up to 500x500 m2!).
  
--> “Links” are stands that open external links. Because this is potentially very disruptive in VR mode,
  a countdown mechanism is developed to avoid any user mistake.
  
--> “Displays” are stands that can display texts and images, 
  and also can play a sound or perform a configurable action.

-----> “Plinths” are displays that can also display a 3D model.

----------> “Carousels” are plinths that display some eye-catching text.
```

Stands are developed as javascript classes to make it easy to extend them and create new reusable ones.

Now, here is how to create your immersion:

*   Copy the template folder, rename it as you wish and start editing the immersion.js file inside. I personally use [VStudio](https://visualstudio.microsoft.com/) to edit files.
*   Use the immersion.js file inside the demo folder as your main reference. You’ll find inside:
    *   Examples of all stands with some explanation on how to use them. Copy and paste the ones you would like to use and configure. Use the ‘dvp’ mode to navigate your immersion and decide where to position your stands.
    *   Examples on how to set the scene, sky, ground, lights and sounds.
    *   Some basic examples on how to import your 3D assets. 
*   You’ll probably need to use the [babylon.js documentation](https://doc.babylonjs.com/) in order to create what you want. All babylon.js features can be used within immersions, and their explanation is usually very good.
*   Regularly test your immersion in your browser. And when you are ready, publish it online so that you could test it on your virtual headset and other mobile machines. 

## Contributing

If you would like to contribute or request a feature, please use the [Github issues board](https://github.com/bruchansky/immersions/issues). And feel free to send feedback or ask questions in the [discussions](https://github.com/bruchansky/immersions/discussions) section.

No automated test is implemented yet, but all use cases are included in the demo. The best way to make sure your contribution isn't breaking anything is to run the demo.

My priority was to build a library that is easy to use, with some clean classes and functions to call. Please let me know if you believe something fundamental should change in the way it is used in the demo and template.

What is inside classes and functions is not as clean. I’ve not programmed in javascript for a very long time. And while I’ve tried to encapsulate things as best I could, I have probably not followed all good practices. Hopefully, the code is still readable and can be extended in a clean fashion.
  
Enjoy!
