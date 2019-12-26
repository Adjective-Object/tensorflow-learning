import tensorflow as tf
from model import lstm_chain


def build_model(sequence_length, num_char_classes, N_LAYERS=4, LAYER_SIZE=1024):

    text_input = tf.keras.Input(shape=(sequence_length,), name="text_input")

    next_char_predictor_lstm = (
        lstm_chain(
            "next_char_predictor_lstm",  # name
            [text_input],
            n_layers=N_LAYERS,
            layer_size=LAYER_SIZE,
            output_layer_size=num_char_classes,
            per_layer_dropout=0.1,
            activation="softmax",
        ),
    )

    model = tf.keras.models.Model(
        inputs=text_input,
        outputs=next_char_predictor_lstm,
        name="mtg_sequence_predictor",
    )

    model.compile(
        # Variant of stochastic gradient descent.
        # see https://www.tensorflow.org/api_docs/python/tf/keras/optimizers/Adam
        optimizer="nadam",
        # categorial_crossentropy is used for classifying categories?
        # e.g. digits in a digit set, next char output of an RNN
        #
        # Via:
        # https://jovianlin.io/cat-crossentropy-vs-sparse-cat-crossentropy/
        # If your targets are one-hot encoded, use categorical_crossentropy
        # But if your targets are integers, use sparse_categorical_crossentropy
        #
        # for multi-class (e.g. multi-hot, not one-hot). use
        # categorical_hinge or binary_crossentropy
        loss={"next_char_predictor_lstm": "categorical_crossentropy"},
        metrics={"next_char_predictor_lstm": ["categorical_accuracy"]},
    )

    return model
