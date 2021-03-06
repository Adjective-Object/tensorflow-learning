import * as tf from "@tensorflow/tfjs";

/**
 * Gets the model input size off the loaded model
 */
export function get2DModelInputSize(
  model: tf.LayersModel
): { width: number; height: number } {
  const modelInputShapes = model.feedInputShapes;

  // console.log("model input", modelInputShapes, "output", model.outputShape);

  if (modelInputShapes.length !== 1) {
    throw new Error("Expected exactly 1 model input shape");
  }
  const inputShape = modelInputShapes[0];

  if (inputShape.length !== 3 || inputShape[2] !== 3) {
    throw new Error(
      "expected model input to have dimensionality [<input_height>, <input_width>, 3]"
    );
  }

  const [height, width] = inputShape;
  if (!height || !width) {
    throw new Error(
      "expected model input to have dimensionality [<input_height>, <input_width>, 3]"
    );
  }

  // Cast because we've aleady checked that it is not null above
  return {
    width,
    height
  };
}
