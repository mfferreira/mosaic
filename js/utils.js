/*
* @Author: Marco Ferreira
* @Date:   2016-12-10 18:05:18
* @Last Modified by:   Marco Ferreira
* @Last Modified time: 2016-12-10 18:32:44
*/

define({
	urlBase: function() {
		return location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
	},

	getAverageRGBA: function (image_data, resolution) {
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
	},

	calculateAspectRatioFit: function (srcWidth, srcHeight, maxWidth, maxHeight) {
		var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
		return { width: srcWidth*ratio, height: srcHeight*ratio };
	},

	getHEXString: function (num) {
		var hex = num.toString(16);
		if (hex.length < 2)
			hex = '0'+hex;
		return hex;
	},

	RGBAtoHEX: function (rgba) {
		var r = this.getHEXString(rgba[0]),
			g = this.getHEXString(rgba[1]),
			b = this.getHEXString(rgba[2]);
			// ignore alpha channel
		return [r,g,b].join('');
	}
});
