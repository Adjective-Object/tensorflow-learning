export function sanatizeNoMarkup(fieldVal: string): string {
  return fieldVal.replace(/[;<>]/g, "");
}
