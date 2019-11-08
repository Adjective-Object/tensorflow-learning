import os
import tensorflow as tf
from model import build_model

if __name__ == "__main__":
    # exisitng dataset packaged into tf.keras (well, utilitiy to download the data)
    mnist = tf.keras.datasets.mnist
    # x_train is the input data as images.
    # y_train is the input data's classes as images.
    (x_train, y_train), (x_test, y_test) = mnist.load_data()

    # set up periodic saving of model
    checkpoint_callback = tf.keras.callbacks.ModelCheckpoint(
        filepath=os.path.join(".", "training_checkpoints", "ckpt_{epoch}"),
        # save_weights_only=True
    )

    # fit the model
    model = build_model()
    model.fit(
        x_train,  # input
        y_train,  # Expected outputs
        epochs=5,
        callbacks=[checkpoint_callback],
    )
    model.evaluate(x_test, y_test, verbose=2)
