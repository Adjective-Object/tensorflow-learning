import * as React from "react";
import { FieldRendererProps } from "./types/FieldRendererProps";
import "./CardManaSymbolsDisplay.css";
import { ManaLikeCost } from "./ManaLikeCost";

export const CardManaSymbolsDisplay = ({
  onUpdateText,
  text
}: FieldRendererProps) => {
  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onUpdateText && onUpdateText(e.target.value.toUpperCase()),
    [onUpdateText]
  );

  return onUpdateText ? (
    <span className="card-mana-symbols-concrete" onChange={onChange}>
      <textarea
        className="card-mana-symbols-input"
        value={text}
        onChange={onChange}
      />
      <ManaLikeCost manaLikeCostString={text} />
    </span>
  ) : (
    <span className="card-mana-symbols-suggestion">
      <ManaLikeCost manaLikeCostString={text} />
    </span>
  );
};
