var canvasPreviewOriginal;
var canvasPreviewCode;
var canvasPreviewTarget;
var canvasOriginal;
var canvasCode;
var canvasTarget;
var ctxPreviewOriginal;
var ctxPreviewCode;
var ctxPreviewTarget;
var ctxOriginal;
var ctxCode;
var ctxTarget;
var imageDataOriginal;
var imageDataCode;
var imageDataTarget;
var imageLoader;

window.onload = function () {
	setup();
}

function setup () {
	canvasPreviewOriginal = document.getElementById("canvasPreviewOriginal");
	canvasPreviewCode = document.getElementById("canvasPreviewCode");
	canvasPreviewTarget = document.getElementById("canvasPreviewTarget");

	canvasOriginal = document.createElement("canvas");
	canvasCode = document.createElement("canvas");
	canvasTarget = document.createElement("canvas");

	ctxPreviewOriginal = canvasPreviewOriginal.getContext("2d");
	ctxPreviewCode = canvasPreviewCode.getContext("2d");
	ctxPreviewTarget = canvasPreviewTarget.getContext("2d");
	ctxOriginal = canvasOriginal.getContext("2d");
	ctxCode = canvasCode.getContext("2d");
	ctxTarget = canvasTarget.getContext("2d");

	imageDataOriginal = null;
	imageDataCode = null;
	imageDataTarget = null;
	
	imageLoader = document.getElementById("imageLoader");
	imageLoader.addEventListener("change", handleImageUpload);
	
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
	canvasPreviewTarget.width = canvasPreviewOriginal.width;

	ctxPreviewOriginal.drawImage(img, 0, 0, canvasPreviewOriginal.width, canvasPreviewOriginal.height);
}

function getBlobURL () {
	canvasTarget.toBlob(function(blob) {
	  var url = (URL || webkitURL).createObjectURL(blob);
	  return url;
	});
}
/*
function getPixelPosition (x, y) {
	return y * (imageData.width * 4) + x*4;
}

function readPixel (x, y) {
	pos = getPixelPosition(x,y);
	return [imageData.data[pos],
			imageData.data[pos+1],
			imageData.data[pos+2]];
}

function writePixel (x, y, r, g, b) {
	pos = getPixelPosition(x,y);
	imageData.data[pos] = r;
	imageData.data[pos+1] = g;
	imageData.data[pos+2] = b;
}

function drawImageData () {
	ctx.putImageData(imageData, 0, 0);
}
*/

function toggleInfoBox (e) {
	var infoBox = document.getElementById("info-box");
	if(infoBox.style.display == "none")
		infoBox.style.display = "block";
	else
		infoBox.style.display = "none";
}
