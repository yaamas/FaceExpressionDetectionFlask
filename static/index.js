// Note "https://webrtchacks.com/webrtc-cv-tensorflow/";

var video = null;
var streamRef = null;

var drawCanvas = null;
var drawCtx = null;

var captureCanvas = null;
var captureCtx = null;

var timeOut1 = null;
var timeOut2 = null;

var front = false;
var constraints = null;

var adjustedCanvas = false;

function flipCamera() {
  front = !front;
  constraints = { video: { facingMode: (front ? "user" : "environment") }, audio: false };
}

function checkCamera() {
  if (form.device.value == "PC") {
    document.getElementById(3).disabled = true;
    document.getElementById(4).disabled = true;
  }
  else if (form.device.value == "Mobile") {
    // Enable the camera options
    document.getElementById(3).disabled = false;
    document.getElementById(4).disabled = false;

    // Set default to back camera
    document.getElementById(4).checked = true;
    front = false;
  }
}

function switchRadio(action) {
  if (action == "start") {
    document.getElementById(1).disabled = true;
    document.getElementById(2).disabled = true;
    document.getElementById(3).disabled = true;
    document.getElementById(4).disabled = true;
  }
  else if (action == "stop") {
    document.getElementById(1).disabled = false;
    document.getElementById(2).disabled = false;

    document.getElementById(1).checked = true;
  }
}

function adjustCanvas(bool) {

  if (!adjustedCanvas || bool) {
    drawCanvas.width = video.videoWidth;
    drawCanvas.height = video.videoHeight;
    
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;

    drawCtx.lineWidth = "5";
    drawCtx.strokeStyle = "blue";
    drawCtx.font = "20px Verdana";
    drawCtx.fillStyle = "red";

    adjustedCanvas = true;
  }
}

function startCamera() {

  // Stop if already playing
  stopCamera();

  // Defaults
  if (constraints === null)
    constraints = { video: true, audio: false };

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        video.srcObject = stream;
        streamRef = stream;
        video.play();

        switchRadio("start");
        timeOut1 = setTimeout(grab, 40);
      })
      .catch(function (err) {
        alert("Start Stream: Stream not started.");
        console.log("Start Stream:", err.name + ": " + err.message);
      });
  }
}

function stopTimeout() {
  clearTimeout(timeOut1);
  clearTimeout(timeOut2);
}

function stopCamera() {
  // Check defaults
  if (streamRef === null) {
    console.log("Stop Stream: Stream not started/stopped.");
  }
  // Check stream
  else if (streamRef.active) {
    video.pause();
    streamRef.getTracks()[0].stop();
    video.srcObject = null;

    stopTimeout();

    switchRadio("stop");

    // Reset canvas after stoppong cam
    // drawCtx.fillStyle = "white";
    // drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);

  }
}

function downloadFrame() {
  var link = document.createElement('a');
  link.download = 'frame.jpeg';
  link.href = document.getElementById('myCanvas').toDataURL("image/jpeg", 1);
  link.click();
}

document.onreadystatechange = () => {
  if (document.readyState === "complete") {

    video = document.querySelector("#videoElement");

    // canvas = document.getElementById("canvas");
    // ctx = canvas.getContext("2d");

    captureCanvas = document.getElementById("captureCanvas");
    captureCtx = captureCanvas.getContext("2d");

    drawCanvas = document.getElementById("drawCanvas");
    drawCtx = drawCanvas.getContext("2d");

    // drawCanvas.width = 640;
    // drawCanvas.height = 480;

    drawCtx.lineWidth = "5";
    drawCtx.strokeStyle = "blue";
    drawCtx.font = "20px Verdana";
    drawCtx.fillStyle = "red";

  }
};

function grab() {
  captureCtx.drawImage(
    video,
    0,
    0,
    video.videoWidth,
    video.videoHeight,
    0,
    0,
    video.videoWidth,
    video.videoHeight,
  );
  console.log(captureCanvas.width, captureCanvas.height);
  captureCanvas.toBlob(upload, "image/jpeg");
}

function upload(blob) {
  var fd = new FormData();
  fd.append("file", blob);
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/uploade", true);
  xhr.onload = function () {
    if (this.status == 200) {
      objects = JSON.parse(this.response);

      drawBoxes(objects);

      timeOut2 = setTimeout(grab, 40);
    }
  };
  xhr.send(fd);
}

function drawBoxes(objects) {
  // drawCtx.clearRect(0, 0, 640, 480);
  objects.forEach(object => {
    let label = object.label;
    let score = Number(object.score);
    let x = Number(object.x);
    let y = Number(object.y);
    let width = Number(object.width);
    let height = Number(object.height);
    
    // To refresh the canvas
    drawCanvas.width = drawCanvas.width; 

    drawCtx.fillText(label + " - " + score, x + 5, y + 20);
    drawCtx.strokeRect(x, y, width, height);
  });
}