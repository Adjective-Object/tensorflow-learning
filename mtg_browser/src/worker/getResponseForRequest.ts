import { AppToWorkerMessage, WorkerToAppMessage } from "./types/messages";
import { WorkerModelContext } from "./types/WorkerModelContext";

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
  }
}
