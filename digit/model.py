import tensorflow as tf

# pulled from tutorial at
# https://www.tensorflow.org/tutorials/quickstart/beginner


def build_model():
    model = tf.keras.models.Sequential(
        [
            # Flatten input image into a vector
            tf.keras.layers.Flatten(input_shape=(28, 28)),
            # Typical everything-connected-to-everyting layer,
            # activated with relu, which forces all negative numbers
            tf.keras.layers.Dense(128, activation="relu"),
            # Set 20% of input layer values to 0 each update during
            # *training only*, not when actually running the netowork.
            #
            # This serves to avoid overfitting to the dataset
            tf.keras.layers.Dropout(0.2),
            # Final activation layer -- classify into one of 10 digits
            tf.keras.layers.Dense(10, activation="softmax"),
        ]
    )

    model.compile(
        # Variant of stochastic gradient descent.
        # see https://www.tensorflow.org/api_docs/python/tf/keras/optimizers/Adam
        optimizer="adam",
        # categorial_crossentropy is used for classifying categories?
        # e.g. digits in a digit set, next char output of an RNN
        #
        # Via:
        # https://jovianlin.io/cat-crossentropy-vs-sparse-cat-crossentropy/
        # If your targets are one-hot encoded, use categorical_crossentropy
        # But if your targets are integers, use sparse_categorical_crossentropy
        #
        # I don't know why this tutorial uses sparse_categorical_crossentropy
        # when the output is one-hot.
        loss="sparse_categorical_crossentropy",
        metrics=[
            # Calculates how often predictions match labels.
            # (Is this just total / match count during a training batch?)
            "accuracy"
        ],
    )

    return model
