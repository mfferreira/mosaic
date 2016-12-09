/*
* @Author: marcoferreira
* @Date:   2016-12-08 20:48:00
* @Last Modified by:   Marco Ferreira
* @Last Modified time: 2016-12-09 04:52:47
*/

// "use strict";

(function() {

	var q = new tileQ();

	// hack to load the worked faster
	var workerBlob = new Blob([
	    "onmessage = function(e) {\
		 	var imgSource = 'http://localhost:8765/color/'+e.data, xhr = new XMLHttpRequest();\
			xhr.onreadystatechange = function() {\
				if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {\
					postMessage(xhr.responseText);\
				}\
			};\
			xhr.open('GET', imgSource, true);\
			xhr.send();}"]);

	// Obtain a blob URL reference to our worker 'file'.
	var workerBlobURL = window.URL.createObjectURL(workerBlob);

	function WebWorker (url, onMessage) {
		var worker = new Worker(url),
			cb = onMessage,
			free = true;

		worker.onmessage = function(e) {
			cb(e.data);
			free = true;
		};
		this.postMessage = function(msg) {
			worker.postMessage(msg);
			free = false;
		};
		this.terminate = function () {
			worker.terminate();
			free = true;
		};
	}

	function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
		var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
		return { width: srcWidth*ratio, height: srcHeight*ratio };
	}

	function getAverageRGBA(image_data, resolution) {
		var multiplicator = parseInt( resolution, 10 ) > 1 ? parseInt( resolution, 10 ) : 10;
		var len = image_data.data.length;
		// console.log("Getting average rgba for data len:", len);
		var count = 0;
		var rgba = [ 0, 0, 0, 0 ];

		for ( var i = 0; i < len; i += multiplicator * 4 )
		{
			rgba[0] = rgba[0] + image_data.data[i];
			rgba[1] = rgba[1] + image_data.data[i + 1];
			rgba[2] = rgba[2] + image_data.data[i + 2];
			rgba[3] = rgba[3] + image_data.data[i + 3];
			count++;
		}

		rgba[0] = ~~ ( rgba[0] / count );
		rgba[1] = ~~ ( rgba[1] / count );
		rgba[2] = ~~ ( rgba[2] / count );
		rgba[3] = ~~ ( rgba[3] / count );

		return rgba;
	}

	function getHEXString(num) {
		var hex = num.toString(16);
		if (hex.length < 2)
			hex = '0'+hex;
		return hex;
	}

	function RGBAtoHEX (rgba) {
		var r = getHEXString(rgba[0]),
			g = getHEXString(rgba[1]),
			b = getHEXString(rgba[2]);
			// ignore alpha channel
		return [r,g,b].join('');
	}

	function getTileHexColor (context, x, y) {
		// get tile data
		var data = context.getImageData(x, y, TILE_WIDTH, TILE_HEIGHT),
			// computes the average color of each tile
			tileColorRGBA = getAverageRGBA(data);

		return RGBAtoHEX(tileColorRGBA);
	}

	function drawTile(context, x, y, tileColorHEX, callback) {
		var tileFetcher = new Worker(workerBlobURL);
		tileFetcher.onmessage = function(e) {
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
		};

		// ask the worker to fetch our <svg> given the tile color
		tileFetcher.postMessage(tileColorHEX);
	}

	function tileQ (context) {
		var queue = {context: context, q: {}};

		this.currentRow = null;

		this.reset = function() {
			queue = {context: context, q: {}};
		}

		this.getQueue = function() {
			return queue;
		}

		this.setContext = function (context) {
			queue.context = context;
		};

		this.getContext = function() {
			return queue.context;
		}

		this.queueTile = function (x, y, tileColorHEX) {
			if (!queue.q[y])
				queue.q[y] = {done: 0, cols: {}};

			queue.q[y].cols[x] = tileColorHEX;
		};

		this.getRow = function(y) {
			return queue.q[y];
		}

		this.setDone = function(y) {
			// console.log("this.setDone:", y);
			queue.q[y].done++;
		};
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
		var aspect = calculateAspectRatioFit(imgHolder.width, imgHolder.height, IMG_WIDTH, IMG_HEIGHT)
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

})();
