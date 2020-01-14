import { SelectionMethod } from "../../model/types/SelectionMethod";

export interface TextCompletionParameters {
  selectionMethod: SelectionMethod;
  seedString: string;
  maxLength: number;
}
