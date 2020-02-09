import { splitBodyStringToSegments } from "../util/TextSegment";
import { sanatizeNoMarkup } from "./sanatizeNoMarkup";

const nonCostSymbols = /[^WUBRG\^TQE/]/;

export function sanatizeBodyText(fieldVal: string): string {
  const segments = splitBodyStringToSegments(fieldVal);
  console.log("sanatize body text segmenets:", segments);
  const out: string[] = [];
  for (let segment of segments) {
    if (segment.isCostSegment) {
      out.push("{" + segment.text.replace(nonCostSymbols, "") + "}");
    } else {
      out.push(sanatizeNoMarkup(segment.text));
    }
  }
  return out.join();
}
