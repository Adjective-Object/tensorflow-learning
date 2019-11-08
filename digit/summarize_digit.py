import os
import tensorflow as tf
from model import build_model

if __name__ == "__main__":
    filepath = os.path.join(".", "training_checkpoints")

    # Load the model
    model = build_model()
    model.load_weights(tf.train.latest_checkpoint(filepath))

    model.summary()
