/**
 * Entrypoint for the persistent worker.
 */
import { TextGenerationModel } from "../model/TextGenerationModel";
import { AppToWorkerMessage, WorkerToAppMessage } from "./types/messages";
import { WorkerModelContext } from "./types/WorkerModelContext";
import memoize from "lodash/memoize";
import { ErrorResponse } from "./types/messages/ErrorResponse";
import { getResponseForRequest } from "./getResponseForRequest";
import { WithRequestId } from "./types/messages/WithRequestId";

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

/**
 * Gloal context for all the models
 */
const globalWorkerModelContext: WorkerModelContext = {
  getTextGenerationModel: memoize(
    (): Promise<TextGenerationModel> => {
      return TextGenerationModel.load(
        "/models/trained_text/model.json",
        "/trained_text_config.json"
      );
    }
  )
};

/**
 * Warm the models in the global context by requesting all of them on init.
 *
 * By evaluating the promises here, we force a fetch / evaluation of the models here.
 */
async function init() {
  await globalWorkerModelContext.getTextGenerationModel();
}

ctx.onmessage = async function(e: MessageEvent): Promise<void> {
  const messageData = e.data as WithRequestId<AppToWorkerMessage>;
  console.log("Worker: Message received from app script", messageData);
  try {
    const responseMessage: WorkerToAppMessage = await getResponseForRequest(
      globalWorkerModelContext,
      messageData
    );

    ctx.postMessage({
      ...responseMessage,
      requestId: messageData.requestId
    });
  } catch (e) {
    // on error in processing message, send back an error response
    const errorResponse: WithRequestId<ErrorResponse> = {
      requestId: messageData.requestId,
      type: "ERROR_RESPONSE",
      errorMessage: e.toString(),
      errorStack: e instanceof Error ? e.stack || null : null
    };
    ctx.postMessage(errorResponse);
  }
};

init();
