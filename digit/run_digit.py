import os
import tensorflow as tf
import numpy as np
from model import build_model

"""
Basic example showing how to load a model from saved weights and run it on input.

In a real example, we would be loading the input data from on-disk files
rather than loading it from anything else
"""

if __name__ == "__main__":
    # exisitng dataset packaged into tf.keras (well, utilitiy to download the data)
    mnist = tf.keras.datasets.mnist
    # x_train is the input data as images.
    # y_train is the input data's classes as images.
    (x_train, y_train), (x_test, y_test) = mnist.load_data()

    filepath = os.path.join(".", "training_checkpoints")

    random_sample_indices = np.random.choice(x_test.shape[0], 10, replace=False)
    random_sample_x = x_test[random_sample_indices]
    random_sample_y = y_test[random_sample_indices]

    # Load the model
    model = build_model()
    model.load_weights(tf.train.latest_checkpoint(filepath))

    print("running on samples", random_sample_indices, "from mnist test set")

    # predict the output for the digits and report ouput
    predictions = model.predict(random_sample_x)

    print("predictions", np.argmax(predictions, axis=1))
    print("actual     ", random_sample_y)
