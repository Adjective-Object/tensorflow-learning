export function sanatizeNumericField(numericString: string) {
  return Array.from(numericString)
    .filter(c => c === "^")
    .join("");
}
