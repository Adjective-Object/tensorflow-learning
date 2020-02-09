import * as React from "react";
import "./DebugCard.css";
import { predictText } from "../worker-suspense";
import { SelectionMethod } from "../text-generation-model/types/SelectionMethod";
import { ErrorResponse } from "../worker/types/messages/ErrorResponse";
import { TextCompletionResponse } from "../worker/types/messages/TextCompletionRespose";
import debounce from "lodash/debounce";
import { VocabLimits } from "../text-generation-model/types/VocabLimits";
import { FieldRendererProps } from "./types/FieldRendererProps";

import "./FieldWithPrediction.css";

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
            title="refresh suggestion"
          >
            ⟲
          </button>
        </>
      );
    } else {
      return (
        <>
          <FieldContent text={predictionResponse.completedString} />
          <section className="card-field-value-buttons">
            <section className="card-field-value-buttons-inner">
              <button
                className="card-field-value-commit"
                onClick={commitValue}
                title="accept suggestion"
              >
                +
              </button>
              <button
                className="card-field-value-refresh"
                onClick={refreshPrediction}
                title="refresh suggestion"
              >
                ⟲
              </button>
            </section>
          </section>
        </>
      );
    }
  }
);

export const FieldWithPrediction = React.memo(
  ({
    prefix,
    currentValue,
    onSetCurrentValue,
    maxLength,
    vocabLimits,
    FieldContent,
    placeholder
  }: {
    prefix: string;
    currentValue: string;
    onSetCurrentValue: (v: string) => void;
    maxLength: number;
    FieldContent: React.ComponentType<FieldRendererProps>;
    vocabLimits?: VocabLimits;
    placeholder: React.ReactElement;
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
      <>
        <FieldContent onUpdateText={setValue} text={displayValue} />
        <React.Suspense fallback={placeholder}>
          <FieldPrediction
            prefix={prefix + currentValue}
            onCommit={onCommit}
            selectionMethod={selectionMethodWithLimitedVocab}
            maxLength={maxLength}
            FieldContent={FieldContent}
          />
        </React.Suspense>
      </>
    );
  }
);

FieldWithPrediction.displayName = "FieldWithPrediction";
