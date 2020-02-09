import * as tf from "@tensorflow/tfjs";

/**
 * Gets the model input size off the loaded model
 */
export function getModelInputSize(model: tf.LayersModel): number {
  const modelInputShapes = model.feedInputShapes;

  // console.log("model input", modelInputShapes, "output", model.outputShape);

  if (modelInputShapes.length !== 1) {
    throw new Error("Expected exactly 1 model input shape");
  }
  const inputShape = modelInputShapes[0];
  if (
    inputShape.length !== 2 ||
    inputShape[0] !== null ||
    inputShape[1] === null
  ) {
    throw new Error(
      "expected model input to have dimensionality [null, <input_size>]"
    );
  }

  // Cast because we've aleady checked that it is not null above
  return inputShape[1] as number;
}
