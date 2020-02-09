/**
 * Ways that an image can be resized to fit the input/output parameters
 * of the neural network
 *
 * STRETCH_TO_FIT will resize the image so it fits the exact input width/height of the
 * network before feeding it in. It _does not_ preserve aspect ratio before feeding it
 * into the network
 *
 * SCALE_TO_FIT will scale the image so it fits inside the image's input dimensions. This
 * preserves the image's aspect ratio before feeding it into the network, but may lose some
 * resolution
 *
 * STITCH_PATCHWORk will run patches of the image at native resolution over the input image
 * and stitch the results together. This will take the longest to generate and may show
 * artifacts on image borders.
 */
type ScaleModelInput = "SCALE_TO_FIT" | "STRETCH_TO_FIT" | "STITCH_PATCHWORK";

export interface GenerateImageRequest {
  type: "GENERATE_IMAGE_REQUEST";
  name: string;
  destinationSize: {
    width: number;
    height: number;
  };
  fitImageToModel: {
    grayscale: ScaleModelInput;
    colorize: ScaleModelInput;
  };
  colorIdentity: "W" | "U" | "B" | "R" | "G" | "C";
}
