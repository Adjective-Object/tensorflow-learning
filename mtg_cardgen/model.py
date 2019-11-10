import tensorflow as tf

# pulled from tutorial at
# https://www.tensorflow.org/tutorials/quickstart/beginner


def build_model(input_string_length, features_length, scalars_length):
    print(
        "building model with features_length =",
        features_length,
        "input_string_length =",
        input_string_length,
    )

    text_input = tf.keras.Input(shape=(input_string_length,), name="text_input")
    text_sequence = tf.keras.layers.Reshape(target_shape=(1, input_string_length))(
        text_input
    )

    input_lstm = tf.keras.layers.LSTM(32, name="input_lstm", return_sequences=True)(
        text_sequence
    )
    # inner_lstm_1 = tf.keras.layers.LSTM(32, name="inner_lstm_1", return_sequences=True)(
    #     input_lstm
    # )
    # inner_lstm_2 = tf.keras.layers.LSTM(32, name="inner_lstm_2", return_sequences=True)(
    #     inner_lstm_1
    # )
    output_lstm = tf.keras.layers.LSTM(32, name="output_lstm")(input_lstm)

    scalar_predictor_hidden_layer = tf.keras.layers.Dense(
        64, name="scalar_predictor_hidden_layer"
    )(output_lstm)

    scalar_predictor = tf.keras.layers.Dense(
        scalars_length, name="scalar_predictor", activation="linear"
    )(scalar_predictor_hidden_layer)

    feature_prediction_hidden_layer = tf.keras.layers.Dense(
        64, name="feature_prediction_hidden_layer"
    )(output_lstm)

    feature_prediction = tf.keras.layers.Dense(
        features_length, name="feature_prediction", activation="softmax"
    )(feature_prediction_hidden_layer)

    model = tf.keras.models.Model(
        inputs=text_input, outputs=[scalar_predictor, feature_prediction],
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
        loss={
            "feature_prediction": "categorical_hinge",
            # prefer logarithmic error over mean squared error because we think
            # messing up the scalar costs of a card is not as bad as messing up
            # the classification of the card.
            "scalar_predictor": "mean_squared_error",
        },
        metrics=[
            # Calculates how often predictions match labels.
            # (Is this just total / match count during a training batch?)
            "categorical_accuracy",
            "mean_absolute_error",
        ],
    )

    return model
