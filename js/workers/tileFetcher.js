/*
* @Author: marcoferreira
* @Date:   2016-12-08 20:48:00
* @Last Modified by:   Marco Ferreira
* @Last Modified time: 2016-12-10 20:28:51
*/

define(['../utils'], function(utils) {

	// hack to load the worked faster
	var workerBlob = function(urlBase) {
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
	};

	// Obtain a blob URL reference to our worker 'file'.
	var workerBlobURL = function(workerBlob) {
		if (workerBlob)
			return window.URL.createObjectURL(workerBlob);
	};

	var getWorkerBlobURL = function(urlBase) {
		var worker = workerBlob(urlBase);
		return workerBlobURL(worker)
	};

	var getWorker = function (onMessage) {
		var workerBlobURL = getWorkerBlobURL(utils.urlBase());
		var worker = new Worker(workerBlobURL);
		worker.onmessage = onMessage;
		return worker;
	}


	return {
		getWorker: getWorker
	}

})
