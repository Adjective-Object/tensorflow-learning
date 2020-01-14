import { WithRequestId } from "../worker/types/messages/WithRequestId";
import { WorkerToAppMessage } from "../worker/types/messages";

let requestId = 0;
function getNextRequestId(): string {
  return `request-${requestId++}`;
}

export class RequestResponseWorker {
  constructor(private _worker: Worker) {}
  /**
   * Map of listeners to the resolve fucntion of promises
   * that are waiting on that ID.
   */
  private listenersMap: Map<
    string,
    { resolve: (val: any) => void; reject: (err: any) => void }
  > = new Map();

  public install() {
    this._worker.onmessage = this._onMessage.bind(this);
  }

  public request(request: any) {
    let resolve: null | ((v: any) => void) = null;
    let reject: null | ((e: any) => void) = null;

    const requestId = getNextRequestId();
    this._worker.postMessage({
      ...request,
      requestId
    });

    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    if (resolve == null || reject == null) {
      throw new Error("resolve or reject was null after promise instanciation");
    }

    this.listenersMap.set(requestId, {
      resolve,
      reject
    });

    return promise;
  }

  private _onMessage(e: MessageEvent) {
    const messageData = e.data as WithRequestId<WorkerToAppMessage>;
    const originatingRequestId = messageData.requestId;
    const listener = this.listenersMap.get(originatingRequestId);

    console.log(messageData);

    if (!listener) {
      throw new Error(
        `got response id ${originatingRequestId} not tracked by a listener (${Array.from(
          this.listenersMap.keys()
        )})`
      );
    }

    this.listenersMap.delete(originatingRequestId);

    if (messageData.type === "ERROR_RESPONSE") {
      listener.reject(messageData);
    } else {
      listener.resolve(messageData);
    }
  }
}
