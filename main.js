import "./style.css";

import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
// import * as tasksVision from "@mediapipe/tasks-vision/wasm";

const demosSection = document.getElementById("demos");
let handLandmarker = undefined;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;

const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks("./wasm");

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU",
    },
    runningMode: runningMode,
    numHands: 2,
  });
  demosSection.classList.remove("invisible");
};
createHandLandmarker();

const image = document.getElementById("source");
console.log(image);
/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement?.getContext("2d");

// Preload the MP3 files
let audioFile1 = new Audio("./A_chord.mp3");
let audioFile2 = new Audio("./D_chord.mp3");

// Function to play the first audio file
function playAudioFile1() {
  let audioInstance = new Audio(audioFile1.src);
  audioInstance.play();
}

// Function to play the second audio file
function playAudioFile2() {
  let audioInstance = new Audio(audioFile2.src);
  audioInstance.play();
}

// // Example usage
// playAudioFile1(); // Plays the first file
// // If called again while the first is still playing, it will layer over it
// playAudioFile1();

// Check if webcam access is supported.
const hasGetUserMedia = () => {
  var _a;
  return !!((_a = navigator.mediaDevices) === null || _a === void 0
    ? void 0
    : _a.getUserMedia);
};
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}
// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!handLandmarker) {
    console.log("Wait! objectDetector not loaded yet.");
    return;
  }
  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }
  // getUsermedia parameters.
  const constraints = {
    video: true,
  };
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}
let previousIndexFingerY = null;
let previousThumbY = null;
// let gestureDetected = false;
// Function to calculate the Euclidean distance between two points
function calculateDistance(point1, point2) {
  const xDiff = point1.x - point2.x;
  const yDiff = point1.y - point2.y;
  return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}

let previousWristY = null;
// Function to detect the gesture
function detectGestureLeftHand(landmarks) {
  //   const thumbTip = landmarks[4];
  const wrist = landmarks[0];
  // Calculate the distance between thumb tip and index finger tip
  //   const distance = calculateDistance(thumbTip, wrist);
  // Check if thumb and index finger are touching (you might need to adjust the threshold)
  //   const areTouching = distance < 0.1;
  const _d = 0.1;
  // Check if they are moving downwards
  const isMovingDownwards =
    previousWristY !== null && wrist.y > _d + previousWristY;
  // Update previous positions
  console.log({
    //     distance,
    //     areTouching,
    //     previousWristY,
    WristX: wrist.x,
    //     diff: previousWristY ? wrist.y - previousWristY : "-",
  });
  previousWristY = wrist.y;
  // Set gesture detected flag
  return areTouching && isMovingDownwards;
}
let tone;
// Function to detect the gesture
function detectGestureRightHand(landmarks) {
  const thumbTip = landmarks[4];
  const indexFingerTip = landmarks[8];
  // Calculate the distance between thumb tip and index finger tip
  const distance = calculateDistance(thumbTip, indexFingerTip);
  // Check if thumb and index finger are touching (you might need to adjust the threshold)
  const areTouching = distance < 0.1;
  const _d = 0.1;
  // Check if they are moving downwards
  const isMovingDownwards =
    previousIndexFingerY !== null &&
    indexFingerTip.y > _d + previousIndexFingerY &&
    previousThumbY !== null &&
    thumbTip.y > _d + previousThumbY;
  // Update previous positions

  previousIndexFingerY = indexFingerTip.y;
  previousThumbY = thumbTip.y;
  // Set gesture detected flag
  return areTouching && isMovingDownwards;
}

let flames = 0;
let cancelFlames = null;
// let extraType = "nerdy";
const triggerFlames = () => {
  flames = true;
  clearTimeout(cancelFlames);
  cancelFlames = setTimeout(() => {
    flames = false;
  }, 2000);
};
const mySelect = document.getElementById("mySelect");
let printed = false;
let lastVideoTime = -1;
let results = undefined;
console.log(video);
async function predictWebcam() {
  canvasElement.style.width = video.videoWidth;
  canvasElement.style.height = video.videoHeight;
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await handLandmarker.setOptions({ runningMode: "VIDEO" });
  }
  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = handLandmarker.detectForVideo(video, startTimeMs);
  }
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  //   console.log(results.multiHandedness);
  //   const handType = results.multiHandedness[i].classification[0].label; // 'Left' or 'Right'
  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      //if (!printed)

      //console.log({landmarks})
      //printed = true
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5,
      });
      //   console.log({ handType });
      drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
      if (landmarks[0].x < 0.5) {
        // Detect gesture
        const gestureDetected = detectGestureRightHand(landmarks);
        // Do something if gesture is detected
        if (gestureDetected) {
          console.log(
            "Gesture Detected: Thumb and Index Finger touching and moving downwards"
          );
          // Reset gesture detection
          //   gestureDetected = false;
          if (tone == "LOW") playAudioFile1();
          else playAudioFile2();

          triggerFlames();
          // .
        }
      } else {
        if (landmarks[0].x < 0.75) {
          tone = "LOW";
        } else {
          tone = "HIGH";
        }

        console.log("left hand", tone);
      }
    }
  }
  canvasCtx.restore();
  console.log();
  console.log(mySelect.value);
  //
  // ctx.font = "30px Arial";
  // ctx.fillText("Hello World", 10, 50);
  if (flames && mySelect.value == "nerd") {
    // translate context to center of canvas
    canvasCtx.translate(canvasElement.width * 0.5, canvasElement.height * 0.5);

    // flip context horizontally, because webcam image is mirrored
    canvasCtx.scale(-1, 1);

    //flames &&
    canvasCtx.textAlign = "center";

    canvasCtx.font = "120px Arial";
    canvasCtx.fillText(tone == "LOW" ? "A" : "D", 0, 0);

    // canvasCtx.scale(-1, 1);
  }
  if (flames && mySelect.value == "cool")
    canvasCtx.drawImage(
      image,
      0,
      canvasElement.height * 0.75,
      canvasElement.width,
      canvasElement.height * 0.25
    );
  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
