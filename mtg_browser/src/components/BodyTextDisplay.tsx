import * as React from "react";
import { FieldRendererProps } from "./types/FieldRendererProps";
import "./BodyTextDisplay.css";
import { ResizingTextArea } from "./ResizingTextArea";
import { ManaLikeCost } from "./ManaLikeCost";
import { TextSegment, splitBodyStringToSegments } from "../util/TextSegment";

export const TextSegmentView = ({ segment }: { segment: TextSegment }) => {
  if (segment.isCostSegment) {
    return <ManaLikeCost manaLikeCostString={segment.text} />;
  }
  {
    return <span>{segment.text}</span>;
  }
};

export const BodyTextDisplay = ({ onUpdateText, text }: FieldRendererProps) => {
  const segments: TextSegment[] = React.useMemo(
    () => splitBodyStringToSegments(text),
    [text]
  );

  const valueDisplay = (
    <span className="card-body-display">
      {segments.map((segment, i) => (
        <TextSegmentView key={i} segment={segment} />
      ))}
    </span>
  );

  return onUpdateText ? (
    <span className="card-body-concrete">
      <ResizingTextArea
        className="card-body-input"
        value={text}
        onChange={onUpdateText}
        direction="vertical"
      />
      {valueDisplay}
    </span>
  ) : (
    <section className="card-body-prediction">{valueDisplay}</section>
  );
};
