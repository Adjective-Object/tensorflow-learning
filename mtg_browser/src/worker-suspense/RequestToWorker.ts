import { ErrorResponse } from "../worker/types/messages/ErrorResponse";
import { RequestResponseWorker } from "./RequestResponseWorker";

export class RequestToWorker<TRequest, TResponse> {
  private _pendingPromise: Promise<TResponse> | null = null;
  private _result: TResponse | ErrorResponse | null = null;

  constructor(
    private _worker: RequestResponseWorker,
    private _request: TRequest
  ) {}

  read() {
    if (this._result != null) {
      return this._result;
    } else if (this._pendingPromise == null) {
      this._pendingPromise = (this._worker.request(this._request) as Promise<
        TResponse
      >).then(this._saveResultAndPassThrough, this._saveResultAndPassThrough);
    }
    throw this._pendingPromise;
  }

  refresh() {
    this._result = null;
    this._pendingPromise = null;
  }

  private _saveResultAndPassThrough = <T extends TResponse | ErrorResponse>(
    r: T
  ): T => {
    this._result = r;
    return r;
  };
}
