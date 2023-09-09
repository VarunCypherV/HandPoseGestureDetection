import "./App.css";
import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import { drawhand } from "./utilities";
import * as fp from "fingerpose";
import victory from "./assests/victory.png";
import thumbs_up from "./assests/thumbs_up.png";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [emoji, setEmoji] = useState(null);
  const images = { thumbs_up: thumbs_up, victory: victory };

  useEffect(() => {
    const runHandpose = async () => {
      const net = await handpose.load(); // waiting for the model to load (neural network)

      // Set up an interval to detect hand movements
      const intervalId = setInterval(() => {
        detect(net);
      }, 10);

      // Clean up the interval when the component unmounts
      return () => {
        clearInterval(intervalId);
      };
    };

    runHandpose();
  }, []);

  const detect = async (net) => {
    // Check if webcam data is available
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Set the width and height
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make hand detection
      const hand = await net.estimateHands(video);

      // Gesture Detection
      if (hand.length > 0) {
        const GE = new fp.GestureEstimator([
          fp.Gestures.VictoryGesture,
          fp.Gestures.ThumbsUpGesture,
        ]);

        const gesture = await GE.estimate(hand[0].landmarks, 8);

        if (
          gesture.gestures !== undefined &&
          gesture.gestures.length > 0
        ) {
          const confidence = gesture.gestures.map(
            (prediction) => prediction.score
          );
          const maxConfidence = confidence.indexOf(
            Math.max.apply(null, confidence)
          );

          if (maxConfidence !== -1) {
            setEmoji(gesture.gestures[maxConfidence].name);
          }
        }
      }

      // Draw
      const ctx = canvasRef.current.getContext("2d");
      drawhand(hand, ctx);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            margin: "auto",
            textAlign: "center",
            zIndex: 9,
            height: 800,
            width: 800,
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            margin: "auto",
            textAlign: "center",
            zIndex: 9,
            height: 800,
            width: 800,
          }}
        />

        {emoji !== null ? (
          <img
            src={images[emoji]}
            style={{
              position: "absolute",
              left: 400,
              bottom: 500,
              margin: "auto",
              textAlign: "center",
              height: 100,
            }}
          />
        ) : null}
      </header>
    </div>
  );
}

export default App;

const fingerJoints = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

