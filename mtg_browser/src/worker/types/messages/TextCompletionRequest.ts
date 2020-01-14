import { TextCompletionParameters } from "../TextCompletionParameters";

export interface TextCompletionRequest {
  type: "TEXT_COMPLETION_REQUEST";
  textCompletionParameters: TextCompletionParameters;
}
