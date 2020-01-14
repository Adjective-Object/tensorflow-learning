import memoize from "lodash/memoize";
import { TextCompletionResponse } from "../worker/types/messages/TextCompletionRespose";
import { TextCompletionRequest } from "../worker/types/messages/TextCompletionRequest";
import { RequestToWorker } from "./RequestToWorker";
import { RequestResponseWorker } from "./RequestResponseWorker";
import { SelectionMethod } from "../model/types/SelectionMethod";

export const bindPredictText = (worker: RequestResponseWorker) =>
  memoize(
    (seedString: string, selectionMethod: SelectionMethod, maxLength: number) =>
      new RequestToWorker<TextCompletionRequest, TextCompletionResponse>(
        worker,
        {
          type: "TEXT_COMPLETION_REQUEST",
          textCompletionParameters: {
            seedString,
            selectionMethod,
            maxLength
          }
        }
      ),
    JSON.stringify.bind(JSON)
  );
