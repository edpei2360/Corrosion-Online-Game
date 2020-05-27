/*
 * TODO:
 * 	semitransparent entities
 * 	text
 *
 *  fix entites only being drawn after moving!!
 *
 * 	documentation :(
 * 	fix annoying warning "XMLHttpRequest on the main thread ..."
 *
 * 	put interpolation in to player.js
 *
 * 	rotation only effect mainplayer
 *
 * 	move movement calculations onto client side
 * 	send rotation data as vector and use rotateToVec
 * 	keep main player in center of screen using entity.setStatic() (will need to setScale)
 *
 *  move all the player stuff into different sub folders (getters/setters to modif	y variables)
 *  merge local data and playersDict, server data will stay the same but use the new player class to merge
 *
 * 	key/mouse bind system
 */

var socket = io();

import {glInit, canvas} from "./gl/glManager.js"
import {setCamera, moveCamera} from "./gl/camera.js"
import {Entity} from "./entity.js"
import {TransparentEntity} from "./transparententity.js"
import {texPoop, texCircle} from "./gl/texture.js"
import {Text} from "./text.js"
import {Player} from "./player.js"

function main() {
	glInit();
}

//var playersDict = {};
var localData = {};
var serverData;

export function loaded() {
	setCamera(0, 0);

	//text test
		//background
		var e = new Entity(100,100);
		e.setColor(128,128,128);
		e.transform();
		e.sendDataToGPU();

		var t = new Text(0,0, "AYYLMAO\nTEXT\nQWERTYUIOPASDFGHJKLZXCVBNM", 1);
		t.sendDataToGPU();

		var border = new TransparentEntity(0);
		border.translateTo(...t.getMiddle());
		border.setScale(...t.getSize());
		border.setColor(255, 255, 255, 150);
		border.setStatic();
		border.sendDataToGPU();
	//test


	//mouse stuff
	canvas.addEventListener("mousemove", onMouseMove);
	canvas.addEventListener("mousedown", onMouseDown);
	canvas.addEventListener("mouseup", onMouseUp);


	//tell server new player has connected
	socket.emit('new player');

	socket.on('remove player', function(data) {
		localData[data].e.remove(); // idk if this is needed
		delete localData[data];
		//playersDict[data].remove();
		delete playersDict[data];
	});

	// store a temporary version of the data every time new player joins
	// should only be used as position reference
	socket.on('update local log', function(players, id) {
	  localData = players;

		// loop may be inefficent, replace with getters and setter and not create new object
		for (var id in players) {
			localData[id] = new Player(players[id].x_pos_player, players[id].y_pos_player,
																 players[id].p_vel, players[id].rotation);
			localData[id].draw();
		}


		// add new entity
		//playersDict[id] = new Entity();
/*
		// if client is missing any entites add them to local storage
		for(var id in players) {
			if (!(id in localData)) {
				playersDict[id] = new Entity();
				playersDict[id].setTexture(texCircle); // change others texture
				playersDict[id].setZ(100);//need good value
			}
			// draw all players that are not main player
			playersDict[id].setTexture(texCircle);
			playersDict[id].translateTo(localData[id].x_pos_player * 0.1,localData[id].y_pos_player * 0.1);
			playersDict[id].sendDataToGPU();
		}
		// draw main player
		playersDict[id].setTexture(texCircle); // change main player texture
		playersDict[id].translateTo(0,0);//change to position given by server
		playersDict[id].setZ(200);//need good value
		playersDict[id].sendDataToGPU()

		*/
	});

	// stores the data that was transmitted by the server
	socket.on('transmit', function(players) {
	  serverData = players;
	});


	told = performance.now();
	setInterval(loop, 1000/60); //60 times a second could go full speed but idk
}

// moves player by small increments to their new position
function moveTo(p_id) {
  var difference_y = serverData[p_id].y_pos_player - localData[p_id].y_pos_player;
  var difference_x = serverData[p_id].x_pos_player - localData[p_id].x_pos_player;

  localData[p_id].y_pos_player += difference_y/10;
  localData[p_id].x_pos_player += difference_x/10;

  // prevent the calculations going on forever
  if(Math.abs(difference_y) < 0.5) {
    localData[p_id].y_pos_player = serverData[p_id].y_pos_player
  }
  if(Math.abs(difference_x) < 0.5) {
    localData[p_id].x_pos_player = serverData[p_id].x_pos_player
  }

	localData[p_id].draw();

	// draw sub frames of movement
	//playersDict[p_id].translateTo(localData[p_id].x_pos_player * 0.1,localData[p_id].y_pos_player * 0.1);
	//playersDict[p_id].sendDataToGPU();
}

var told;
function loop() {
	const tnow = performance.now();
	const t = tnow - told;
	told = tnow;

	// send key inputs
  key_input.time_modification = t;
	socket.emit('key input', key_input);

  for (var id in localData) {
    while ((localData[id].x_pos_player != serverData[id].x_pos_player) ||
        (localData[id].y_pos_player != serverData[id].y_pos_player)) {
      moveTo(id);
    }
  }
}

window.onload = main;

function onMouseMove(evt) {
	const rect = canvas.getBoundingClientRect();
	const x = evt.clientX - rect.left - 320;
	const y = rect.top + 240 - evt.clientY;
	//TODO only effect mainPlayer
	for (var id in playersDict) {
    var ent = playersDict[id];
		ent.rotateToVec(x, y);
		ent.sendDataToGPU();
  }
}

function onMouseDown(evt) {
}

function onMouseUp(evt) {
}
