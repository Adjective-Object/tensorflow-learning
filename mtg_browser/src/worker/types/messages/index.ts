import { TextCompletionRequest } from "./TextCompletionRequest";
import { TextCompletionResponse } from "./TextCompletionRespose";
import { ErrorResponse } from "./ErrorResponse";

export type AppToWorkerMessage = TextCompletionRequest;
export type WorkerToAppMessage = TextCompletionResponse | ErrorResponse;
