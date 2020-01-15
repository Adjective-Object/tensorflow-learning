import * as React from "react";
import "./DebugCard.css";
import { predictText } from "../worker-suspense";
import { SelectionMethod } from "../model/types/SelectionMethod";
import { ErrorResponse } from "../worker/types/messages/ErrorResponse";
import { TextCompletionResponse } from "../worker/types/messages/TextCompletionRespose";
import debounce from "lodash/debounce";
import { VocabLimits } from "../model/types/VocabLimits";
import { sanatizeManaCost } from "../field-sanatizers/sanatizeManaCost";
import { sanatizeTypeLine } from "../field-sanatizers/sanatizeTypeLine";
import { sanatizeNumericField } from "../field-sanatizers/sanatizeNumericField";
import { sanatizeNoMarkup } from "../field-sanatizers/sanatizeNoMarkup";

const usePredictedValue = (
  predictionPrefix: string,
  selectionMethod: SelectionMethod,
  maxLength: number
): [ErrorResponse | TextCompletionResponse, () => void] => {
  const predictionRequest = React.useMemo(
    () => predictText(predictionPrefix, selectionMethod, maxLength),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [predictionPrefix, JSON.stringify(selectionMethod), maxLength]
  );
  const predictionResponse = predictionRequest.read();

  // HACK force a rerender, since idk how hooks can alert on subscription
  const [, setForceRerender] = React.useState();
  const refreshPrediction = React.useCallback(() => {
    predictionRequest.refresh();
    setForceRerender({});
  }, [predictionRequest]);

  return [predictionResponse, refreshPrediction];
};

const PredictionErrorResponseIndicator = (props: {
  errorResponse: ErrorResponse;
}) => {
  return (
    <div className="card-field-error">
      <section className="card-field-error-details">
        <h3>{props.errorResponse.errorMessage}</h3>
        <pre>{props.errorResponse.errorStack}</pre>
      </section>
    </div>
  );
};

interface FieldRendererProps {
  onUpdateText?: (v: string) => void;
  text: string;
}

const FieldPrediction = React.memo(
  ({
    prefix,
    onCommit,
    maxLength,
    selectionMethod,
    FieldContent
  }: {
    prefix: string;
    onCommit: (newVal: string) => void;
    maxLength: number;
    selectionMethod: SelectionMethod;
    FieldContent: React.ComponentType<FieldRendererProps>;
  }) => {
    const [predictionResponse, refreshPrediction] = usePredictedValue(
      prefix,
      selectionMethod,
      maxLength
    );

    const commitValue = React.useCallback(() => {
      if (predictionResponse.type === "TEXT_COMPLETION_RESPONSE") {
        onCommit(predictionResponse.completedString);
      } else {
        throw new Error(
          "Tried to complete with error response:" +
            predictionResponse.errorMessage
        );
      }
    }, [onCommit, predictionResponse]);

    if (predictionResponse.type === "ERROR_RESPONSE") {
      return (
        <>
          <PredictionErrorResponseIndicator
            errorResponse={predictionResponse}
          />
          <button
            className="card-field-value-refresh"
            onClick={refreshPrediction}
          >
            refresh
          </button>
        </>
      );
    } else {
      return (
        <>
          <FieldContent text={predictionResponse.completedString} />
          <button className="card-field-value-commit" onClick={commitValue}>
            commit
          </button>
          <button
            className="card-field-value-refresh"
            onClick={refreshPrediction}
          >
            refresh
          </button>
        </>
      );
    }
  }
);

const FieldWithPrediction = React.memo(
  ({
    prefix,
    currentValue,
    onSetCurrentValue,
    maxLength,
    vocabLimits,
    FieldContent
  }: {
    prefix: string;
    currentValue: string;
    onSetCurrentValue: (v: string) => void;
    maxLength: number;
    FieldContent: React.ComponentType<FieldRendererProps>;
    vocabLimits?: VocabLimits;
  }) => {
    const [selectionMethod] = React.useState<SelectionMethod>({
      type: "take_with_probability"
      // type: "take_best"
    });
    const selectionMethodWithLimitedVocab = React.useMemo(() => {
      return {
        ...selectionMethod,
        vocabLimits
      };
    }, [selectionMethod, vocabLimits]);

    const [displayValue, setDisplayValue] = React.useState(currentValue);

    const debouncedSetCurrentValue = React.useMemo(
      () => debounce(onSetCurrentValue, 400),
      [onSetCurrentValue]
    );

    const setValue = React.useCallback(
      (v: string) => {
        setDisplayValue(v);
        debouncedSetCurrentValue(v);
      },
      [setDisplayValue, debouncedSetCurrentValue]
    );

    const onCommit = React.useCallback(
      (v: string) => {
        const nextValue = displayValue + v;
        onSetCurrentValue(nextValue);
      },
      [displayValue, onSetCurrentValue]
    );

    // When currentValue is updated directly, make sure displayValue matches it
    React.useEffect(() => {
      setDisplayValue(currentValue);
    }, [currentValue]);

    return (
      <div className="card-field-value-container">
        <FieldContent onUpdateText={setValue} text={displayValue} />
        <React.Suspense fallback={<span>...</span>}>
          <FieldPrediction
            prefix={prefix + currentValue}
            onCommit={onCommit}
            selectionMethod={selectionMethodWithLimitedVocab}
            maxLength={maxLength}
            FieldContent={FieldContent}
          />
        </React.Suspense>
      </div>
    );
  }
);

FieldWithPrediction.displayName = "FieldWithPrediction";

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
    sanatizeNoMarkup
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
      <FieldWithPrediction
        prefix="<1"
        vocabLimits={oneLineTextVocabLimits}
        currentValue={displayName}
        onSetCurrentValue={setDisplayName}
        maxLength={15}
        FieldContent={SimpleTextFieldRenderer}
      />
      <FieldWithPrediction
        prefix={"<1" + displayName + ";2{"}
        vocabLimits={manaOrPowerTouchnessVocabLimits}
        currentValue={manaCost}
        onSetCurrentValue={setManaCost}
        maxLength={15}
        FieldContent={SimpleTextFieldRenderer}
      />
      <FieldWithPrediction
        prefix={"<1" + displayName + ";2{" + manaCost + "};3"}
        vocabLimits={oneLineTextVocabLimits}
        currentValue={typeLine}
        onSetCurrentValue={setTypeLine}
        maxLength={40}
        FieldContent={SimpleTextFieldRenderer}
      />
      <FieldWithPrediction
        prefix={
          "<1" + displayName + ";2{" + manaCost + "};3" + typeLine + ";4&"
        }
        vocabLimits={manaOrPowerTouchnessVocabLimits}
        currentValue={power}
        onSetCurrentValue={setPower}
        maxLength={15}
        FieldContent={SimpleTextFieldRenderer}
      />
      <FieldWithPrediction
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
        FieldContent={SimpleTextFieldRenderer}
      />
      <FieldWithPrediction
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
      />
      <FieldWithPrediction
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
        FieldContent={SimpleTextFieldRenderer}
      />
    </section>
  );
});

Card.displayName = "Card";
