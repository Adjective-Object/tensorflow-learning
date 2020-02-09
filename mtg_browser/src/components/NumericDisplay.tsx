import * as React from "react";
import { FieldRendererProps } from "./types/FieldRendererProps";
import "./NumericDisplay.css";

export const NumericDisplay = ({ onUpdateText, text }: FieldRendererProps) => {
  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onUpdateText && onUpdateText(e.target.value.toUpperCase()),
    [onUpdateText]
  );

  const number = React.useMemo(() => {
    return Array.from(text).filter(x => x == "^").length;
  }, [text]);

  return onUpdateText ? (
    <span className="card-number-concrete" onChange={onChange}>
      <textarea
        className="card-number-input"
        value={text}
        onChange={onChange}
      />
      {number}
    </span>
  ) : (
    <span className="card-number-suggestion">+{number}</span>
  );
};
