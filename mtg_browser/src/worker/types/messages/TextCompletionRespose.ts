import { TextCompletionParameters } from "../TextCompletionParameters";

export interface TextCompletionResponse {
  type: "TEXT_COMPLETION_RESPONSE";
  textCompletionParameters: TextCompletionParameters;
  completedString: string;
}
