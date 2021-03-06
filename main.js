/* TODOs:
 *  - improve performance (especially for large images)
 *  - offer settings (fill with 0 / 1 / 0|1, ...)
 *  - use RGBA (and/or RGB)
 *  - support Unicode
 *  - encryption, hide images, QR-Codes, ...
 */

var canvasPreviewOriginal;

var canvasTarget;

var ctxPreviewOriginal;

var ctxTarget;

var imageDataOriginal;
var imageDataTarget;

var code;
var codeText;

var imageLoader;

const KEYSTROKE_TIMEOUT = 750; // time (millis) that is waited to generate target image after a keystroke
var timeouts;

window.onload = function () {
	setup();
}

function setup () {
	canvasPreviewOriginal = document.getElementById("canvasPreviewOriginal");

	canvasTarget = document.createElement("canvas");
	
	ctxPreviewOriginal = canvasPreviewOriginal.getContext("2d");
	
	ctxTarget = canvasTarget.getContext("2d");
	
	imageDataOriginal = null;
	imageDataTarget = null;
	
	code = [];
	codeText = "";
	
	timeouts = [];
	
	imageLoader = document.getElementById("imageLoader");
	imageLoader.addEventListener("change", handleImageUpload);

	textareaCode = document.getElementById("textarea-code");
	textareaCode.addEventListener("input", handleTextChange);

	infoButton = document.getElementById("info-button");
	infoButton.addEventListener("click", toggleInfoBox);
}

function handleImageUpload (e) {
	var reader = new FileReader();
	reader.onload = function (event) {
		var img = new Image();
		img.onload = function () {
			setOriginalImage(img);
			createPreviewOriginal(img);
			
			readCodeFromOriginalImage();
		}
		img.src = event.target.result;
	}
	reader.readAsDataURL(e.target.files[0]);
}

function setOriginalImage (img) {
	var canvasTemp = document.createElement("canvas")
	var ctxTemp = canvasTemp.getContext("2d");
	canvasTemp.width = img.width;
	canvasTemp.height = img.height;
	ctxTemp.drawImage(img, 0, 0);
	imageDataOriginal = ctxTemp.getImageData(0, 0, img.width, img.height);
}

function getCanvasPreviewWidth () {
	var imageWidth = imageDataOriginal.width;
	var imageHeight = imageDataOriginal.height;
	var canvasHeight = canvasPreviewOriginal.height;
	return imageWidth * canvasHeight / imageHeight;
}

function createPreviewOriginal (img) {
	canvasPreviewOriginal.width = getCanvasPreviewWidth();

	ctxPreviewOriginal.drawImage(img, 0, 0, canvasPreviewOriginal.width, canvasPreviewOriginal.height);
}

function readCodeFromOriginalImage () {
	code = [];
	var colors;
	for(var y=0; y<imageDataOriginal.height; y++) {
		for(var x=0; x<imageDataOriginal.width; x++) {
			colors = readPixel(x, y);
			for(var i=0; i<3; i++) {
				code.push(colors[i]%2);
			}
		}
	}
	
	// get text
	codeText = "";
	var currentAsciiCode;
	for(var i=0; i<Math.floor(code.length/8); i++) {
		currentAsciiCode = 0;
		for(var j=0; j<8; j++) {
			currentAsciiCode *= 2;
			currentAsciiCode += code[8*i + j];
		}
		codeText += String.fromCharCode(currentAsciiCode);
	}
	document.getElementById("textarea-code").value = codeText;
}

function getCode (pos) {
	if(pos >= code.length) {
		return 0; // could also be 1 or randomly 0/1 or original value
	}
	return code[pos];
}

function handleTextChange (e) {
	// the new target image should not be generated with every new keystroke -> timeouts
	for(var i in timeouts) {
		window.clearTimeout(timeouts[i]);
	}
	timeouts = [];

	document.getElementById("link-target").classList.add("disabled");
	timeouts.push(window.setTimeout(updateCodeAndTarget, KEYSTROKE_TIMEOUT));
}

function updateCodeAndTarget () {
	if(imageDataOriginal == null) { return; }

	// update code
	code = [];
	codeText = document.getElementById("textarea-code").value;
	for(var i=0; i<codeText.length; i++) {
		var asciiCode = codeText.charCodeAt(i);
		for(var j=7; j>=0; j--) {
			if(asciiCode >= 2**j) {
				code.push(1);
				asciiCode %= 2**j;
			}
			else {
				code.push(0);
			}
		}
	}

	// update target
	canvasTarget.width = imageDataOriginal.width;
	canvasTarget.height = imageDataOriginal.height;
	imageDataTarget = ctxTarget.createImageData(imageDataOriginal.width, imageDataOriginal.height);
	var i = 0;
	for(var y=0; y<imageDataOriginal.height; y++) {
		for(var x=0; x<imageDataOriginal.width; x++) {
			colors = readPixel(x, y);
			for(var j=0; j<3; j++) {
				imageDataTarget.data[i++] = 2*Math.floor(colors[j]/2) + getCode(y * imageDataOriginal.width * 3 + x * 3 + j);
			}
			imageDataTarget.data[i++] = 255;
		}
	}
	ctxTarget.putImageData(imageDataTarget, 0, 0);

	// update link
	canvasTarget.toBlob(function(blob) {
		var url = (URL || webkitURL).createObjectURL(blob);
		document.getElementById("link-target").href = url;
		document.getElementById("link-target").classList.remove("disabled");
	});
}

function getPixelPosition (x, y, imageData) {
	return y * (imageData.width * 4) + x*4;
}

function readPixel (x, y, imageData) {
	imageData = (typeof imageData !== 'undefined') ? imageData : imageDataOriginal;
	pos = getPixelPosition(x, y, imageData);
	return [imageData.data[pos],
			imageData.data[pos+1],
			imageData.data[pos+2],
			imageData.data[pos+3]];
}


function toggleInfoBox (e) {
	var infoBox = document.getElementById("info-box");
	if(infoBox.style.display == "none")
		infoBox.style.display = "block";
	else
		infoBox.style.display = "none";
}
