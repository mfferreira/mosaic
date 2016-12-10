/*
* @Author: marcoferreira
* @Date:   2016-12-08 20:48:00
* @Last Modified by:   Marco Ferreira
* @Last Modified time: 2016-12-10 17:58:31
*/

define({

	getWorkerBlobURL: function(urlBase) {
		var worker = this.workerBlob(urlBase);
		return this.workerBlobURL(worker)
	},

	// hack to load the worked faster
	workerBlob: function(urlBase) {
		if (urlBase)
			return new Blob([
			    "onmessage = function(e) {\
				 	var imgSource = '"+urlBase+"/color/'+e.data, xhr = new XMLHttpRequest();\
					xhr.onreadystatechange = function() {\
						if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {\
							postMessage(xhr.responseText);\
						}\
					};\
					xhr.open('GET', imgSource, true);\
					xhr.send();}"]);
	},

	// Obtain a blob URL reference to our worker 'file'.
	workerBlobURL: function(workerBlob) {
		if (workerBlob)
			return window.URL.createObjectURL(workerBlob);
	}

})
