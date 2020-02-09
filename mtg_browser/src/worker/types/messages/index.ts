import { ErrorResponse } from "./ErrorResponse";
import { TextCompletionRequest } from "./TextCompletionRequest";
import { TextCompletionResponse } from "./TextCompletionRespose";
import { GenerateImageRequest } from "./GenerateImageRequest";
import { GenerateImageResponse } from "./GenerateImageResponse";

export type AppToWorkerMessage = TextCompletionRequest | GenerateImageRequest;
export type WorkerToAppMessage =
  | TextCompletionResponse
  | GenerateImageResponse
  | ErrorResponse;
