export interface ErrorResponse {
  type: "ERROR_RESPONSE";
  errorMessage: string;
  errorStack: string | null;
}
