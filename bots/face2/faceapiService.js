const save = require("./utils/saveFile");
const path = require("path");

const tf = require("@tensorflow/tfjs-node");

const canvas = require("canvas");

const faceapi = require("@vladmandic/face-api/dist/face-api.node.js");
const modelPathRoot = "./models";

let optionsSSDMobileNet;
let optionsTiny;
let optionsAgeGender;

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function image(file) {
  const decoded = tf.node.decodeImage(file);
  const casted = decoded.toFloat();
  const result = casted.expandDims(0);
  decoded.dispose();
  casted.dispose();
  return result;
}

async function detect(tensor) {
  var result = {}
  try {
    result = await faceapi.detectAllFaces(tensor, optionsTiny) //, new faceapi.ageGenderNetOptions()) //optionsSSDMobileNet);
  } catch(err) {
    console.log(err)
  }
  // const result = await faceapi.detectAllFaces(tensor).withFaceLandmarks().withFaceExpressions()
  //, optionsSSDMobileNet).withFaceExpressions();
  return result;
}

async function main(file, filename) {
  var result
  var tensor

  await faceapi.tf.setBackend("tensorflow");
  await faceapi.tf.enableProdMode();
  await faceapi.tf.ENV.set("DEBUG", false);
  await faceapi.tf.ready();

  console.log(
    //`Version: TensorFlow/JS ${faceapi.tf?.version_core} FaceAPI ${
    //  faceapi.tf + " " +
    //  faceapi.version.faceapi
    // } Backend: ${faceapi.tf?.getBackend()}`
  );

  //console.log("Loading FaceAPI models");
  const modelPath = path.join(__dirname, modelPathRoot);

//console.log(faceapi)
//console.log(faceapi.nets)
// ageGenderNet
// faceExpressionNet
// faceLandmark68Net
// faceLandmark68TinyNet
// faceRecognitionNet
// ssdMobilenetv1
// tinyFaceDetector
// tinyYolov2

//  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
//  await faceapi.nets.ageGenderNet.loadFromDisk(modelPath);

try {
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
} catch(err) {
  console.log(err)
}

  optionsTiny = new faceapi.TinyFaceDetectorOptions({
    minConfidence: 0.33,
    inputSize: 160
  });

  //optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({
    //minConfidence: 0.5,
  //});

  if (file) {
    tensor = await image(file);
    result = await detect(tensor);
    console.log("Detected faces:", result.length);
  }

  //const canvasImg = await canvas.loadImage(file);
  //const out = await faceapi.createCanvasFromMedia(canvasImg);
  //faceapi.draw.drawDetections(out, result);
  //save.saveFile(filename, out.toBuffer("image/jpeg"));
  //console.log(`done, saved results to ${filename}`);

  tensor.dispose();

  return result;
}

module.exports = {
  detect: main,
};
