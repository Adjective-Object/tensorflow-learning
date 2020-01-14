export type WithRequestId<T> = T & {
  requestId: string;
};
