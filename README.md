# Florida State Reps Tool: In Case of Update
This project uses webpack to bundle javascript, so the js that is pushed to data.nbcstations is basically unreadable (sorry I like my hot reloading during dev). 

To update it, you'll need to clone this repository, install dev dependencies and dependencies, run the graphic on a local server, make any tweaks, build the graphic, and then put the code onto the server. Here's step by step instrux: 

## Before you start

You will need node installed on your machine. In the command line you can run `node -v` and `npm -v` to see if each of these is installed. If not, [install them](https://www.npmjs.com/get-npm). 

## Step One: Clone and Install

Using the command line, navigate to wherever you want to clone this repo. Then run: 

```
ENGLISH: git clone https://github.com/swhart22/fl-reps.git
SPANISH: git clone https://github.com/swhart22/fl-reps-es.git
```

The folder and a bunch of files should be wherever you cloned them into. Navigate into the folder: 

```
cd fl-reps
```

And then run: 

```
npm i
```

Hopefully that worked! It may take a few seconds. You will need to have your node proxy set, or be working on C3PO.

```
sudo npm config set proxy http://proxyanbcge.nbc.com:80
sudo npm config set proxy http://proxyanbcge.nbc.com:80 -g
```

If you got an error already try updating your node version! If that doesn't work, just text me and I can make any updates. If you did not get an error, continue!

## Step Two: Run a Local Server to Update and Test Graphic

In the `fl-reps` directory, you should be able to run

```
npm run start
```

and have a browser window open up with the graphic in it. If that doesn't happen, make sure you don't have anything running on `localhost:3000` and then try again.

At this phase, you can make changes to the javascript. Any javascript I'm using to power the graphic is in the `/src/js/` folder. This is the javascript that will be bundled into build mode.

Any text you would need to change would either be in `src/templates/index.html` or in `src/js/draw.js`, in the  `updateMap` function.

## Step Three: Build and Deploy

Once all the changes are made to the graphic, quit the local server by running Ctrl C in the terminal window you have running it. Then, again in your `fl-reps` directory, run 

```
npm run build
```

This compiles all javascript and css etc. into a new folder it creates that is called `dist`. The contents of that folder are what you post to data.nbcstations.com. You should have in there an `index.html` file, an `app.bundle.js` file, a `data` directory with topojson files for each market, and a bunch of font files that I included for the use of fontawesome icons. 





