import os
from imageio import imsave
from matplotlib import pyplot as plt
from pix2pix_constants import DEBUG_IMAGE_DIR
import tensorflow as tf


def save_debug_ouput_fig(suffix, model, test_input, tar):
    prediction = model(test_input, training=True)
    plt.figure(figsize=(15, 15))

    display_list = [test_input[0], tar[0], prediction[0]]
    title = ["Input Image", "Ground Truth", "Predicted Image"]

    for i in range(3):
        plt.subplot(1, 3, i + 1)
        plt.title(title[i])
        # getting the pixel values between [0, 1] to plot it.
        plt.imshow(display_list[i] * 0.5 + 0.5)
        plt.axis("off")

    if not os.path.isdir(DEBUG_IMAGE_DIR):
        os.makedirs(DEBUG_IMAGE_DIR)

    out_path = os.path.join(DEBUG_IMAGE_DIR, "debug_" + suffix + ".png")
    print("Saving to", out_path)
    plt.savefig(out_path)
    plt.close()


def save_model_fig(model, out_path):
    tf.keras.utils.plot_model(model, show_shapes=True, dpi=64, to_file=out_path)
