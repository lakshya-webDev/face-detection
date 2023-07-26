import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import faceapi from "face-api.js";

const FaceRecognitionApp = () => {
  const [openCamera, setOpenCamera] = useState(false);
  const videoRef = useRef();

  const loadModels = async () => {
    // Load face-api.js models
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
  };

  useEffect(() => {
    const init = async () => {
      // Call the loadModels function to load the models
      await loadModels();

      // Start the camera
      setOpenCamera(true);
    };

    init();
    // Clean up: Stop the camera and clear canvas when component unmounts
    return () => {
      stopCamera();
      clearCanvas();
    };
  }, []);

  const startCamera = () => {
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: {} })
        .then((videoStream) => {
          videoRef.current.srcObject = videoStream;
        })
        .catch((error) => console.error("Error accessing the camera:", error));
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const clearCanvas = () => {
    const canvas = faceapi.createCanvasFromMedia(videoRef.current);
    document.body.append(canvas);
    const displaySize = {
      width: videoRef.current.width,
      height: videoRef.current.height
    };
    faceapi.matchDimensions(canvas, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFaceDetection = async () => {
    const videoEl = videoRef.current;
    const canvas = faceapi.createCanvasFromMedia(videoEl);
    document.body.append(canvas);
    const displaySize = { width: videoEl.width, height: videoEl.height };
    faceapi.matchDimensions(canvas, displaySize);

    const detectFace = async () => {
      const detections = await faceapi
        .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      requestAnimationFrame(detectFace);
    };

    detectFace();
  };

  const handleCloseCamera = () => {
    setOpenCamera((prevCamera) => !prevCamera);
  };

  useEffect(() => {
    if (openCamera) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [openCamera]);

  return (
    <div className="face-recognisation">
      <h2>Face Recognition</h2>
      <video
        ref={videoRef}
        width="300"
        height="560"
        autoPlay
        muted
        onPlay={handleFaceDetection}
      />
      <button onClick={handleCloseCamera}>
        {openCamera ? "ON" : "OFF"} Camera
      </button>
    </div>
  );
};

export default FaceRecognitionApp;
