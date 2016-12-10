/*
* @Author: marcoferreira
* @Date:   2016-12-08 20:48:00
* @Last Modified by:   Marco Ferreira
* @Last Modified time: 2016-12-10 18:35:53
*/

define(function (require) {

	var q = require('app/queue').newQueue(),
		worker = require('app/worker'),
		utils = require('app/utils');

	function getTileHexColor (context, x, y) {
		// get tile data
		var data = context.getImageData(x, y, TILE_WIDTH, TILE_HEIGHT),
			// computes the average color of each tile
			tileColorRGBA = utils.getAverageRGBA(data);

		return utils.RGBAtoHEX(tileColorRGBA);
	}

	function drawTile(context, x, y, tileColorHEX, callback) {
		var tileFetcher = worker.getWorker(function(e) {
			// worker sends the <svg> string

			var img = new Image();
			img.onload = function() {
				context.drawImage(img, x, y);
				q.setDone(y);
				if (callback)
					callback(y);
			};

			// convert <svg> string to base64 and set it as image src
			img.src = 'data:image/svg+xml;base64,'+window.btoa(e.data);
			tileFetcher.terminate();
			tileFetcher = undefined;
		});

		// ask the worker to fetch our <svg> given the tile color
		tileFetcher.postMessage(tileColorHEX);
	}

	function processQ (y) {
		var y = y || 0,
			row = q.getRow(y),
			cols = Object.keys(row.cols),
			numCols = cols.length,
			x, color;

		if (q.currentRow === y) {
			if (row.done < numCols)
				// ignore call if current row isn't fully displayed
				return;
			else {
				// jump to next row (y)
				y += TILE_HEIGHT;
				row = q.getRow(y);
				if (!row)
					return;
				cols = Object.keys(row.cols);
				numCols = cols.length;
			}
		}

		q.currentRow = y;

		for (var i=0; i < numCols; i++) {
			x = cols[i];
			color = row.cols[x];
			// console.log("y:", y, "x:", x, "color:", color);
			drawTile(q.getContext(), x, y, color, processQ);
		}
	}

	// add a canvas for image preview to the DOM
	var imgPreview = document.createElement('canvas');
		imgPreview.id = 'imgPreview';
		imgPreview.width = IMG_WIDTH;
		imgPreview.height = IMG_HEIGHT;

	// add a canvas to draw the tiles to the DOM
	var imgTiles = document.createElement('canvas');
		imgTiles.id = 'imgTiles';
		imgTiles.width = IMG_WIDTH;
		imgTiles.height = IMG_HEIGHT;

	// our two canvas contexts
	var imgPreviewContext = imgPreview.getContext('2d'),
		imgTilesContext = imgTiles.getContext('2d'),

		// this will hold the original image data
		imgHolder = new Image(),
		tilesHolder = new Image(),

		// use the imgPreview (smaller) to figure out how many tiles to render
		xTiles = imgPreview.width / TILE_WIDTH,
		yTiles = imgPreview.height / TILE_HEIGHT;

	document.getElementById('imageHolder').appendChild(imgPreview);
	document.getElementById('imageHolder').appendChild(imgTiles);

	imgHolder.onload = function() {
		var aspect = utils.calculateAspectRatioFit(imgHolder.width, imgHolder.height, IMG_WIDTH, IMG_HEIGHT)
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

		var tileColorHEX;

		// divides the image into tiles
		for (var y=0, _y=0; y < yTiles; y++) {
			_y = y * TILE_HEIGHT;
			for (var x=0, _x=0; x < xTiles; x++) {
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
	}

	//
	// LOAD IMAGE FROM USER COMPUTER
	//
	document.getElementById('imageInput').onchange = function (e) {
		var target = e.target || window.event.srcElement,
			files = target.files;

		// browser supports FileReader
		if (FileReader && files && files.length) {
			var f = new FileReader();
			f.onload = function () {
				imgHolder.src = f.result;
			}
			f.readAsDataURL(files[0]);
		}

		// FileReader is not supported
		else {
			console.log("ERROR: browser does not support \"FileReader\"")
		}
	}

});
