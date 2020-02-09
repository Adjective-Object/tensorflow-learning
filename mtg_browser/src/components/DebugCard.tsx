import * as React from "react";
import "./DebugCard.css";
import { VocabLimits } from "../model/types/VocabLimits";
import { sanatizeManaCost } from "../field-sanatizers/sanatizeManaCost";
import { sanatizeTypeLine } from "../field-sanatizers/sanatizeTypeLine";
import { sanatizeNumericField } from "../field-sanatizers/sanatizeNumericField";
import { sanatizeNoMarkup } from "../field-sanatizers/sanatizeNoMarkup";
import { FieldRendererProps } from "./types/FieldRendererProps";
import { CardTitleDisplay } from "./CardTitleDisplay";
import { CardManaSymbolsDisplay } from "./CardManaSymbolsDisplay";
import { FieldWithPrediction } from "./FieldWithPrediction";
import { NumericDisplay } from "./NumericDisplay";
import { BodyTextDisplay } from "./BodyTextDisplay";
import { sanatizeTitleLine } from "../field-sanatizers/sanatizeTitleLine";

const SimpleTextFieldRenderer = ({
  onUpdateText,
  text
}: FieldRendererProps) => {
  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdateText && onUpdateText(e.target.value),
    [onUpdateText]
  );

  return onUpdateText ? (
    <input type="text" value={text} onChange={onChange}></input>
  ) : (
    <>{text}</>
  );
};

const oneLineTextVocabLimits: VocabLimits = {
  allowTokenizedWords: false,
  allowNewlines: false,
  allowManaAndNumbersMarkup: false,
  allowAlphabetic: true,
  allowNumeric: false,
  allowNormalPuncutaion: false,
  limitTransitions: false
};

const manaOrPowerTouchnessVocabLimits: VocabLimits = {
  allowTokenizedWords: false,
  allowNewlines: false,
  allowManaAndNumbersMarkup: true,
  allowAlphabetic: false,
  allowNumeric: false,
  allowNormalPuncutaion: false,
  limitTransitions: false
};

const bodyTextLimits: VocabLimits = {
  allowTokenizedWords: true,
  allowNewlines: true,
  allowManaAndNumbersMarkup: true,
  allowAlphabetic: true,
  allowNumeric: true,
  allowNormalPuncutaion: true,
  limitTransitions: true
};

const useSanatizedField = (
  initialValue: string,
  sanatizer: (v: string) => string
): [string, (v: string) => void] => {
  const [fieldVal, setFieldVal] = React.useState(initialValue);
  const sanatizedSetCallback = React.useCallback(
    (v: string) => {
      setFieldVal(sanatizer(v));
    },
    [sanatizer, setFieldVal]
  );

  return [fieldVal, sanatizedSetCallback];
};

export const Card = React.memo(() => {
  const [displayName, setDisplayName] = useSanatizedField(
    "abandon reason",
    sanatizeTitleLine
  );
  const [manaCost, setManaCost] = useSanatizedField("^^R", sanatizeManaCost);
  const [typeLine, setTypeLine] = useSanatizedField(
    "creature",
    sanatizeTypeLine
  );
  const [power, setPower] = useSanatizedField("", sanatizeNumericField);
  const [toughness, setToughness] = useSanatizedField("", sanatizeNumericField);
  const [loyalty, setLoyalty] = useSanatizedField("", sanatizeNumericField);
  const [body, setBody] = useSanatizedField("", sanatizeNoMarkup);

  return (
    <section className="card-container">
      <section className="card-title-line card-line-container">
        <section className="card-title card-line-field">
          <FieldWithPrediction
            placeholder={<span>...</span>}
            prefix="<1"
            vocabLimits={oneLineTextVocabLimits}
            currentValue={displayName}
            onSetCurrentValue={setDisplayName}
            maxLength={15}
            FieldContent={CardTitleDisplay}
          />
        </section>
        <section className="card-mana-cost">
          <FieldWithPrediction
            placeholder={<span>...</span>}
            prefix={"<1" + displayName + ";2{"}
            vocabLimits={manaOrPowerTouchnessVocabLimits}
            currentValue={manaCost}
            onSetCurrentValue={setManaCost}
            maxLength={15}
            FieldContent={CardManaSymbolsDisplay}
          />
        </section>
      </section>
      <section className="card-img"></section>
      <section className="card-type-line card-line-container">
        <section className="card-type card-line-field">
          <FieldWithPrediction
            placeholder={<span>...</span>}
            prefix={"<1" + displayName + ";2{" + manaCost + "};3"}
            vocabLimits={oneLineTextVocabLimits}
            currentValue={typeLine}
            onSetCurrentValue={setTypeLine}
            maxLength={40}
            FieldContent={CardTitleDisplay}
          />
        </section>
      </section>
      <section className="card-power-toughness">
        <span className="card-power">
          <FieldWithPrediction
            placeholder={<span>...</span>}
            prefix={
              "<1" + displayName + ";2{" + manaCost + "};3" + typeLine + ";4&"
            }
            vocabLimits={manaOrPowerTouchnessVocabLimits}
            currentValue={power}
            onSetCurrentValue={setPower}
            maxLength={15}
            FieldContent={NumericDisplay}
          />
        </span>
        /
        <span className="card-toughness">
          <FieldWithPrediction
            placeholder={<span>...</span>}
            prefix={
              "<1" +
              displayName +
              ";2{" +
              manaCost +
              "};3" +
              typeLine +
              ";4&" +
              power +
              ";5&"
            }
            vocabLimits={manaOrPowerTouchnessVocabLimits}
            currentValue={toughness}
            onSetCurrentValue={setToughness}
            maxLength={15}
            FieldContent={NumericDisplay}
          />
        </span>
      </section>
      {/* <FieldWithPrediction
        placeholder={<span>...</span>}
        prefix={
          "<1" +
          displayName +
          ";2{" +
          manaCost +
          "};3" +
          typeLine +
          ";4&" +
          power +
          ";5&" +
          toughness +
          ";6&"
        }
        vocabLimits={manaOrPowerTouchnessVocabLimits}
        currentValue={loyalty}
        onSetCurrentValue={setLoyalty}
        maxLength={15}
        FieldContent={SimpleTextFieldRenderer}
      /> */}
      <section className="card-body">
        <FieldWithPrediction
          placeholder={<span>...</span>}
          prefix={
            "<1" +
            displayName +
            ";2{" +
            manaCost +
            "};3" +
            typeLine +
            ";4&" +
            power +
            ";5&" +
            toughness +
            ";6&" +
            loyalty +
            ";7"
          }
          vocabLimits={bodyTextLimits}
          currentValue={body}
          onSetCurrentValue={setBody}
          maxLength={80}
          FieldContent={BodyTextDisplay}
        />
      </section>
    </section>
  );
});

Card.displayName = "Card";
