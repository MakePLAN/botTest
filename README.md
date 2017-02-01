# Jibo Caregiver

Jibo skill for aiding those with Alzheimer's in their day to day lives 

## Prerequisities

[Jibo SDK](https://developers.jibo.com/docs/)  
[NodeJS](https://docs.npmjs.com/getting-started/installing-node)  
IFTTT account

## Installation

```
git clone git@github.com:ArkJibo/JiboSkill1.git
npm install
npm install pixi.js
npm install --global grunt-cli
npm install --global jibo-cli
```

## Testing

### Unit tests

We use the Mocha testing framework to write and run unit tests. All functionality **must** have a matching unit test.  
Documentation can be found [here](https://mochajs.org/)

## Execution

This project uses the [Grunt](http://gruntjs.com/) task runner  
* ```grunt build``` - runs lint, unit tests, and simulator
* ```grunt test``` - runs lint and unit tests
* ```grunt lint``` - only runs lint

### Special notes

When trying to run the simulator, it might not be able to find 'pixi.js/bin/pixi.js'  
&nbsp;&nbsp;&nbsp;&nbsp;If this happens, the pixi.js folder structure might have been installed as node_modules/pixi.js/dist/pixi.js  
&nbsp;&nbsp;&nbsp;&nbsp;My fix for this issue has been to change the name of 'dist' to 'bin'  

### Archived

#### IFTTT
Original Code and sample posted by [Michael Rodriguez](https://github.com/michaelrod77) in this [forum post](https://discuss.jibo.com/t/how-to-connect-jibo-sdk-to-ifttt-maker-recipe-in-10-minutes/1305)
