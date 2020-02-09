import * as React from "react";

export const ResizingTextArea = (props: {
  className: string;
  onChange: (newValue: string) => void;
  value: string;
  direction: "horizontal" | "vertical";
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const measureAndResize = React.useCallback(() => {
    if (!textareaRef.current) {
      return;
    }
    const textarea = textareaRef.current;
    if (props.direction === "horizontal") {
      textarea.style.setProperty("width", "0");
      const intrinsicWidth = textarea.scrollWidth;
      textarea.style.setProperty("width", intrinsicWidth + "px");
    } else if (props.direction === "vertical") {
      textarea.style.setProperty("height", "0");
      const intrinsicHeight = textarea.scrollHeight;
      textarea.style.setProperty("height", intrinsicHeight + "px");
    }
  }, [textareaRef, props.direction]);

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      props.onChange(e.target.value);
    },
    [props.onChange]
  );

  React.useLayoutEffect(() => {
    measureAndResize();
  }, [props.value]);

  return (
    <textarea
      className={props.className}
      value={props.value}
      style={{
        whiteSpace: props.direction === "horizontal" ? "nowrap" : undefined
      }}
      ref={textareaRef}
      onInput={measureAndResize}
      onChange={onChange}
    />
  );
};
