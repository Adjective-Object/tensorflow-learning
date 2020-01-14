// eslint-disable-next-line
import AppWorker from "worker-loader!../worker";
import { bindPredictText } from "./predictText";
import { RequestResponseWorker } from "./RequestResponseWorker";

const requestResponseWorker = new RequestResponseWorker(new AppWorker());
requestResponseWorker.install();

export const predictText = bindPredictText(requestResponseWorker);
