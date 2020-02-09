export interface TextSegment {
  isCostSegment: boolean;
  text: string;
}

const legalCostSymbols = new Set("WUBRG/PTQE^");
const isCostSymbol = (x: string) => legalCostSymbols.has(x);

const textSegmentFromString = (segmentText: string[]): TextSegment => {
  return {
    isCostSegment: segmentText.every(isCostSymbol),
    text: segmentText.join("")
  };
};

export function splitBodyStringToSegments(bodyString: string): TextSegment[] {
  const bodyTextSegments: TextSegment[] = [];
  let currentBlock: string[] = [];
  for (let c of bodyString) {
    if (c == "{" || c == "}") {
      bodyTextSegments.push(textSegmentFromString(currentBlock));
      currentBlock = [];
    } else {
      currentBlock.push(c);
    }
  }
  if (currentBlock.length) {
    bodyTextSegments.push(textSegmentFromString(currentBlock));
  }

  return bodyTextSegments;
}
