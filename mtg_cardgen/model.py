import tensorflow as tf

# pulled from tutorial at
# https://www.tensorflow.org/tutorials/quickstart/beginner


def build_model(max_names_length, features_length):
    print(
        "building model with features_length =",
        features_length,
        "max_names_length =",
        max_names_length,
    )

    name_fragment_input = tf.keras.Input(
        shape=(max_names_length,), name="name_fragment_input"
    )
    name_fragment_sequence = tf.keras.layers.Reshape(
        target_shape=(1, max_names_length)
    )(name_fragment_input)
    name_predictor_lstm = tf.keras.layers.LSTM(16, name="name_predictor_lstm")(
        name_fragment_sequence
    )
    name_predictor_lstm_flat = tf.keras.layers.Flatten(name="name_predictor_lstm_flat")(
        name_predictor_lstm
    )

    name_predictor_hidden_layer = tf.keras.layers.Dense(
        max_names_length, name="name_predictor_hidden_layer"
    )(name_predictor_lstm_flat)

    feature_prediction_hidden_layer = tf.keras.layers.Dense(
        16, name="feature_prediction_hidden_layer"
    )(name_predictor_lstm_flat)

    feature_prediction_expansion = tf.keras.layers.Dense(
        features_length, name="feature_prediction_expansion"
    )(feature_prediction_hidden_layer)

    concatenated_expanded_layers = tf.keras.layers.concatenate(
        [name_predictor_hidden_layer, feature_prediction_expansion]
    )

    model = tf.keras.models.Model(
        inputs=name_fragment_input, outputs=concatenated_expanded_layers
    )

    model.compile(
        # Variant of stochastic gradient descent.
        # see https://www.tensorflow.org/api_docs/python/tf/keras/optimizers/Adam
        optimizer=tf.keras.optimizers.Adadelta(
            learning_rate=0.001, rho=0.95, epsilon=1e-07,
        ),
        # categorial_crossentropy is used for classifying categories?
        # e.g. digits in a digit set, next char output of an RNN
        #
        # Via:
        # https://jovianlin.io/cat-crossentropy-vs-sparse-cat-crossentropy/
        # If your targets are one-hot encoded, use categorical_crossentropy
        # But if your targets are integers, use sparse_categorical_crossentropy
        loss=tf.keras.losses.LogCosh(),
        metrics=[
            # Calculates how often predictions match labels.
            # (Is this just total / match count during a training batch?)
            "accuracy",
        ],
    )

    return model
