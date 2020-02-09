import { SelectionMethod } from "../../text-generation-model/types/SelectionMethod";

export interface TextCompletionParameters {
  selectionMethod: SelectionMethod;
  seedString: string;
  maxLength: number;
}
