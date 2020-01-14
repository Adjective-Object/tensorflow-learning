export function getReverseLookupMap<T extends string | number>(
  forwardMap: Record<string, T>
): Record<T, string> {
  const reverseMap: Record<T, string> = {} as Record<T, string>;
  for (let forwardKey of Object.keys(forwardMap)) {
    const reverseKey: T = forwardMap[forwardKey];
    if (reverseMap.hasOwnProperty(reverseKey)) {
      throw new Error(
        `duplicate value ${reverseKey} for keys ${forwardKey} and ${reverseMap[reverseKey]} while building reverse map`
      );
    }
    reverseMap[reverseKey] = forwardKey;
  }
  return reverseMap;
}
