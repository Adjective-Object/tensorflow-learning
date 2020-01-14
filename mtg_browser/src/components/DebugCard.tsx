import * as React from "react";
import "./DebugCard.css";
import { predictText } from "../worker-suspense";
import { SelectionMethod } from "../model/types/SelectionMethod";
import { ErrorResponse } from "../worker/types/messages/ErrorResponse";
import { TextCompletionResponse } from "../worker/types/messages/TextCompletionRespose";
import debounce from "lodash/debounce";

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
          />
        </>
      );
    } else {
      return (
        <>
          <FieldContent text={predictionResponse.completedString} />
          <button className="card-field-value-commit" onClick={commitValue} />
          <button
            className="card-field-value-refresh"
            onClick={refreshPrediction}
          />
        </>
      );
    }
  }
);

const FieldWithPrediction = React.memo(
  ({
    prefix,
    initialFieldValue,
    maxLength,
    FieldContent
  }: {
    prefix: string;
    initialFieldValue: string;
    maxLength: number;
    FieldContent: React.ComponentType<FieldRendererProps>;
  }) => {
    const [selectionMethod] = React.useState<SelectionMethod>({
      type: "take_best"
    });

    const [currentValue, setCurrentValue] = React.useState(initialFieldValue);
    const [displayValue, setDisplayValue] = React.useState(initialFieldValue);

    const debouncedSetCurrentValue = React.useMemo(
      () => debounce(setCurrentValue, 100),
      [setCurrentValue]
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
            setCurrentValue={setCurrentValue}
            selectionMethod={selectionMethod}
            maxLength={maxLength}
            FieldContent={FieldContent}
          />
        </React.Suspense>
      </div>
    );
  }
);

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

export const Card = React.memo(() => {
  return (
    <section className="card-container">
      <React.Suspense fallback={<div>...</div>}>
        <FieldWithPrediction
          prefix=""
          initialFieldValue="<1heliod"
          maxLength={15}
          FieldContent={SimpleTextFieldRenderer}
        />
      </React.Suspense>
    </section>
  );
});
