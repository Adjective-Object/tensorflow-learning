export function sanatizeNoMarkup(fieldVal: string): string {
  return fieldVal.replace(
    /[^\nabcdefghijklmnopqrstuvwxyz1234567890-WUBRGCQET^ ,\$\:\.\[\]\{\}]/g,
    ""
  );
}
