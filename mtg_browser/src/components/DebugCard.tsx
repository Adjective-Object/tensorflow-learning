import * as React from "react";
import "./DebugCard.css";
import { predictText } from "../worker-suspense";
import { SelectionMethod } from "../model/types/SelectionMethod";
import { ErrorResponse } from "../worker/types/messages/ErrorResponse";
import { TextCompletionResponse } from "../worker/types/messages/TextCompletionRespose";
import debounce from "lodash/debounce";
import { VocabLimits } from "../model/types/VocabLimits";

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

  const refreshPrediction = React.useCallback(() => {
    predictionRequest.refresh();
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
    setCurrentValue,
    maxLength,
    selectionMethod,
    FieldContent
  }: {
    prefix: string;
    setCurrentValue: (newVal: string) => void;
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
        setCurrentValue(predictionResponse.completedString);
      } else {
        throw new Error(
          "Tried to complete with error response:" +
            predictionResponse.errorMessage
        );
      }
    }, [setCurrentValue, predictionResponse]);

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
      type: "take_best"
    });
    const selectionMethodWithLimitedVocab = React.useMemo(() => {
      return {
        ...selectionMethod,
        vocabLimits
      };
    }, [selectionMethod, vocabLimits]);

    const [displayValue, setDisplayValue] = React.useState(currentValue);

    const debouncedSetCurrentValue = React.useMemo(
      () => debounce(onSetCurrentValue, 100),
      [onSetCurrentValue]
    );

    const setValue = React.useCallback(
      (v: string) => {
        setDisplayValue(v);
        debouncedSetCurrentValue(v);
      },
      [setDisplayValue, debouncedSetCurrentValue]
    );

    return (
      <div className="card-field-value-container">
        <FieldContent onUpdateText={setValue} text={displayValue} />
        <React.Suspense fallback={<span>...</span>}>
          <FieldPrediction
            prefix={prefix + currentValue}
            setCurrentValue={onSetCurrentValue}
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
  allowManaAndNumbersMarkup: false
};

const manaVocabLimits: VocabLimits = {
  allowTokenizedWords: false,
  allowNewlines: false,
  allowManaAndNumbersMarkup: true
};

export const Card = React.memo(() => {
  const [displayName, setDisplayName] = React.useState("heliod");
  const [manaCost, setManaCost] = React.useState("");
  const [typeLine, setTypeLine] = React.useState("");

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
        prefix={"<1" + displayName + ";2"}
        vocabLimits={manaVocabLimits}
        currentValue={manaCost}
        onSetCurrentValue={setManaCost}
        maxLength={15}
        FieldContent={SimpleTextFieldRenderer}
      />
      <FieldWithPrediction
        prefix={"<1" + displayName + ";2" + manaCost + ";3"}
        vocabLimits={oneLineTextVocabLimits}
        currentValue={typeLine}
        onSetCurrentValue={setTypeLine}
        maxLength={15}
        FieldContent={SimpleTextFieldRenderer}
      />
    </section>
  );
});

Card.displayName = "Card";
