import { TextGenerationModel } from "../../text-generation-model/TextGenerationModel";

/**
 * Global state of the worker's text models.
 */
export interface WorkerModelContext {
  getTextGenerationModel: () => Promise<TextGenerationModel>;
}
