/* TODOs:
 *  - improve performance (especially for large images)
 *  - offer settings (fill with 0 / 1 / 0|1, ...)
 *  - support Unicode
 *  - encryption, hide images, QR-Codes, ...
 */

var canvasPreviewOriginal;
var canvasPreviewCode;

var canvasOriginal;
var canvasCode;
var canvasTarget;

var ctxPreviewOriginal;
var ctxPreviewCode;

var ctxOriginal;
var ctxCode;
var ctxTarget;

var imageDataOriginal;
var imageDataCode;
var imageDataTarget;

var code;
var codeText;

var imageLoader;

window.onload = function () {
	setup();
}

function setup () {
	canvasPreviewOriginal = document.getElementById("canvasPreviewOriginal");
	canvasPreviewCode = document.getElementById("canvasPreviewCode");
	
	canvasOriginal = document.createElement("canvas");
	canvasCode = document.createElement("canvas");
	canvasTarget = document.createElement("canvas");
	
	ctxPreviewOriginal = canvasPreviewOriginal.getContext("2d");
	ctxPreviewCode = canvasPreviewCode.getContext("2d");
	
	ctxOriginal = canvasOriginal.getContext("2d");
	ctxCode = canvasCode.getContext("2d");
	ctxTarget = canvasTarget.getContext("2d");
	
	imageDataOriginal = null;
	imageDataCode = null;
	imageDataTarget = null;
	
	code = [];
	codeText = "";
	
	imageLoader = document.getElementById("imageLoader");
	imageLoader.addEventListener("change", handleImageUpload);
	
	textareaCode = document.getElementById("textarea-code");
	textareaCode.addEventListener("input", updateCodeAndTarget);
	
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
			showCodeAsImage();
		}
		img.src = event.target.result;
	}
	reader.readAsDataURL(e.target.files[0]);
}

function setOriginalImage (img) {
	canvasOriginal.width = img.width;
	canvasOriginal.height = img.height;
	ctxOriginal.drawImage(img, 0, 0);
	imageDataOriginal = ctxOriginal.getImageData(0, 0, canvasOriginal.width, canvasOriginal.height);
}

function getCanvasPreviewWidth () {
	var imageWidth = imageDataOriginal.width;
	var imageHeight = imageDataOriginal.height;
	var canvasHeight = canvasPreviewOriginal.height;
	return imageWidth * canvasHeight / imageHeight;
}

function createPreviewOriginal (img) {
	canvasPreviewOriginal.width = getCanvasPreviewWidth();
	canvasPreviewCode.width = canvasPreviewOriginal.width * 3;

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

function showCodeAsImage () {
	imageDataCode = ctxCode.createImageData(imageDataOriginal.width * 3, imageDataOriginal.height);
	var i = 0;
	for(var y=0; y<imageDataOriginal.height; y++) {
		for(var x=0; x<imageDataOriginal.width; x++) {
			for(var j=0; j<3; j++) {
				for(var k=0; k<3; k++) {
					imageDataCode.data[i++] = 255 * (1 - getCode(y * imageDataOriginal.width * 3 + x * 3 + j));
				}
				imageDataCode.data[i++] = 255;
			}
		}
	}
	ctxCode.putImageData(imageDataCode, 0, 0);
	ctxPreviewCode.drawImage(canvasCode, 0, 0, canvasPreviewCode.width, canvasPreviewCode.height);
}

function getCode (pos) {
	if(pos >= code.length) {
		return 0; // could also be 1 or randomly 0/1
	}
	return code[pos];
}

function updateCodeAndTarget (e) {
	if(imageDataOriginal == null) { return; }
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
	showCodeAsImage();
	
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
			imageDataTarget.data[i++] = colors[3];
		}
	}
	ctxTarget.putImageData(imageDataTarget, 0, 0);
	
	canvasTarget.toBlob(function(blob) {
	  var url = (URL || webkitURL).createObjectURL(blob);
	  document.getElementById("link-target").href = url;
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

function writePixel (x, y, r, g, b, imageData) {
	imageData = (typeof imageData !== 'undefined') ? imageData : imageDataOriginal;
	pos = getPixelPosition(x, y, imageData);
	imageData.data[pos] = r;
	imageData.data[pos+1] = g;
	imageData.data[pos+2] = b;
	imageData.data[pos+3] = 255;
}


function toggleInfoBox (e) {
	var infoBox = document.getElementById("info-box");
	if(infoBox.style.display == "none")
		infoBox.style.display = "block";
	else
		infoBox.style.display = "none";
}
