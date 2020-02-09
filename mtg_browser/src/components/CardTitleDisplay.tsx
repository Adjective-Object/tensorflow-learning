import * as React from "react";
import { FieldRendererProps } from "./types/FieldRendererProps";
import "./CardTitleDisplay.css";
import { useTitleCaseString } from "./hooks/useTitleCaseString";
import { ResizingTextArea } from "./ResizingTextArea";

export const CardTitleDisplay = ({
  onUpdateText,
  text
}: FieldRendererProps) => {
  const titleString = useTitleCaseString(text, onUpdateText !== undefined);

  return onUpdateText ? (
    <ResizingTextArea
      className="card-title-concrete"
      onChange={onUpdateText}
      value={titleString}
      direction="horizontal"
    ></ResizingTextArea>
  ) : (
    <span className="suggestion">{titleString}</span>
  );
};
