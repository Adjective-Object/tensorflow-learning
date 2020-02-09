import { AppToWorkerMessage, WorkerToAppMessage } from "./types/messages";
import { WorkerModelContext } from "./types/WorkerModelContext";
import { searchImage } from "../util/searchImage";

export async function getResponseForRequest(
  context: WorkerModelContext,
  request: AppToWorkerMessage
): Promise<WorkerToAppMessage> {
  switch (request.type) {
    case "TEXT_COMPLETION_REQUEST": {
      const model = await context.getTextGenerationModel();
      const {
        seedString,
        selectionMethod,
        maxLength
      } = request.textCompletionParameters;
      const completedString = model.continueSequence(
        seedString,
        selectionMethod,
        (c: string, i: number) =>
          (maxLength > 0 && i >= maxLength) || c == ";" || c == ">"
      );

      return {
        type: "TEXT_COMPLETION_RESPONSE",
        textCompletionParameters: request.textCompletionParameters,
        completedString
      };
    }
    case "GENERATE_IMAGE_REQUEST": {
      // kick off image search in parallel to loading the mdoel
      const fetchRawImage = searchImage(request.name);
      const grayscaleOutput = await context
        .getImageGrayscaleModel()
        .then(async grayscaleModel => {
          // once the model is loaded, run it on the image.
          const image = await fetchRawImage;
          grayscaleModel.predict(image);
        });
    }
  }
}
