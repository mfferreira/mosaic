/*
* @Author: marcoferreira
* @Date:   2016-12-08 20:48:00
* @Last Modified by:   Marco Ferreira
* @Last Modified time: 2016-12-10 21:41:10
*/

"use strict";

define(function (require) {

	var q = require('app/queue').newQueue(),
		tileFetcher = require('app/workers/tileFetcher'),
		utils = require('app/utils'),
		tileCache = {};

	function getTileHexColor (context, x, y) {
		// get tile data
		var data = context.getImageData(x, y, TILE_WIDTH, TILE_HEIGHT),
			// computes the average color of each tile
			tileColorRGBA = utils.getAverageRGBA(data);

		return utils.RGBAtoHEX(tileColorRGBA);
	}

	function insertTile(context, x, y, data, callback) {
		var img = new Image();
		img.onload = function() {
			context.drawImage(img, x, y);
			q.setDone(y);
			if (callback)
				callback(y);
		};
		// convert <svg> string to base64 and set it as image src
		img.src = 'data:image/svg+xml;base64,'+window.btoa(data);
	}

	function drawTile(context, x, y, tileColorHEX, callback) {
		if (tileCache[tileColorHEX])
			insertTile(context, x, y, tileCache[tileColorHEX], callback);
		else {
			var fetcher = tileFetcher.getWorker(function(e) {
				// worker sends the <svg> string
				insertTile(context, x, y, e.data /* <svg> string */, callback);

				fetcher.terminate();
				fetcher = undefined;
			});

			// ask the worker to fetch our <svg> given the tile color
			fetcher.postMessage(tileColorHEX);
		}
	}

	var painter;
	function processQ (y) {
		// console.log("processQ y:", y);

		painter.postMessage({
			q: q.getQueue(),
			y: y || 0,
			TILE_HEIGHT: TILE_HEIGHT
		});



		// y = y || 0;
		// var row = q.getRow(y),
		// 	cols = Object.keys(row.cols),
		// 	numCols = cols.length,
		// 	x, color;

		// // check if this is a callback
		// if (q.currentRow === y) {
		// 	if (row.done < numCols)
		// 		// ignore call if current row isn't fully displayed
		// 		return;
		// 	else {
		// 		// jump to next row (y)
		// 		y += TILE_HEIGHT;
		// 		row = q.getRow(y);
		// 		if (!row)
		// 			// no more rows to work with
		// 			return;
		// 		cols = Object.keys(row.cols);
		// 		numCols = cols.length;
		// 	}
		// }

		// q.currentRow = y;

		// // fill current row with tiles
		// for (var i=0; i < numCols; i++) {
		// 	x = cols[i];
		// 	color = row.cols[x];
		// 	// console.log("y:", y, "x:", x, "color:", color);
		// 	drawTile(q.getContext(), x, y, color, processQ);
		// }
	}

	// canvas for image preview
	var imgPreview = document.createElement('canvas');
		imgPreview.id = 'imgPreview';
		imgPreview.width = IMG_WIDTH;
		imgPreview.height = IMG_HEIGHT;

	// canvas to draw the tiles
	var imgTiles = document.createElement('canvas');
		imgTiles.id = 'imgTiles';
		imgTiles.width = IMG_WIDTH;
		imgTiles.height = IMG_HEIGHT;

	// our two canvas contexts
	var imgPreviewContext = imgPreview.getContext('2d'),
		imgTilesContext = imgTiles.getContext('2d'),

		// this will hold the original image data
		imgHolder = new Image(),

		// use the imgPreview (smaller) to figure out how many tiles to render
		xTiles = imgPreview.width / TILE_WIDTH,
		yTiles = imgPreview.height / TILE_HEIGHT;

	// add the two canvas to the DOM
	document.getElementById('imageHolder').appendChild(imgPreview);
	document.getElementById('imageHolder').appendChild(imgTiles);

	imgHolder.onload = function() {
		var aspect = utils.calculateAspectRatioFit(imgHolder.width, imgHolder.height, IMG_WIDTH, IMG_HEIGHT);
		imgPreview.width = aspect.width;
		imgPreview.height = aspect.height;
		imgTiles.width = aspect.width;
		imgTiles.height = aspect.height;
		console.log("Image loaded WIDTH:", imgHolder.width, "HEIGHT:", imgHolder.height);
		console.log("Drawing canvas TILE_WIDTH:", TILE_WIDTH, "TILE_HEIGHT:", TILE_HEIGHT);
		console.log("xTiles:", xTiles, "yTiles:", yTiles);

		// DRAW THE IMAGE PREVIEW
		imgPreviewContext.drawImage(imgHolder, 0, 0, imgPreview.width, imgPreview.height);

		// set the context the queue is going to use
		q.reset();
		q.setContext(imgTilesContext);

		var tileColorHEX,
			x,  // current column
			_x, // current x-pixel
			y,  // current line
			_y; // current y-pixel

		// divides the image into tiles
		for (y=0, _y=0; y < yTiles; y++) {
			_y = y * TILE_HEIGHT;
			for (x=0, _x=0; x < xTiles; x++) {
				_x = x * TILE_WIDTH;
				// console.log("x:", x, "y:", y);

				// computes the average color of each tile
				tileColorHEX = getTileHexColor(imgPreviewContext, _x, _y);

				// fetches each tile from the server
				q.queueTile(_x, _y, tileColorHEX);
			}
		}
		console.log("Finished queueing all tiles: ", yTiles*xTiles);

		processQ();
	};



	// when user selects an image
	document.getElementById('imageInput').onchange = function (e) {
		if (painter) {
			console.log('A painter is running. Terminating.');
			painter.terminate();
			painter = null;
		}

		// wait 1sec - Worker.terminate() doesn't terminate it immediatly
		setTimeout(function(){
			painter = new Worker('./js/workers/painter.js');
			painter.onmessage = function(e) {
				drawTile(q.getContext(), e.data.x, e.data.y, e.data.color, processQ);
			};

			var target = e.target || window.event.srcElement,
				files = target.files;

			// browser supports FileReader
			if (FileReader && files && files.length) {
				var f = new FileReader();
				f.onload = function () {
					imgHolder.src = f.result;
				};
				f.readAsDataURL(files[0]);
			}

			// FileReader is not supported
			else {
				console.log("ERROR: your browser does not support \"FileReader\"");
				alert("ERROR: your browser does not support \"FileReader\"");
			}

		}, 1000);

	};

});
