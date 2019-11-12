import tensorflow as tf

# pulled from tutorial at
# https://www.tensorflow.org/tutorials/quickstart/beginner


def subsequence(first, *args):
    cur = first
    for arg in args:
        cur = arg(cur)

    return cur


def build_model(
    input_string_length, features_length, scalars_length, identities_length
):
    print(
        "building model with ",
        "input_string_length =",
        input_string_length,
        "features_length =",
        features_length,
        "scalars_length =",
        scalars_length,
        "identities_length =",
        identities_length,
    )

    text_input = tf.keras.Input(shape=(input_string_length,), name="text_input")
    with tf.name_scope("percep_chain"):
        percep_chain = subsequence(
            text_input,
            tf.keras.layers.Dense(32, name="percep_1", activation="relu"),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, name="percep_2", activation="relu"),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, name="percep_3", activation="relu"),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, name="percep_4", activation="relu"),
        )

    with tf.name_scope("lstm_chain"):
        lstm_chain = subsequence(
            text_input,
            tf.keras.layers.Reshape(target_shape=(1, input_string_length)),
            tf.keras.layers.LSTM(
                32, name="lstm_1", activation="tanh", return_sequences=True
            ),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.LSTM(
                32, name="lstm_2", activation="tanh", return_sequences=True
            ),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.LSTM(
                32, name="lstm_3", activation="tanh", return_sequences=True
            ),
            # tf.keras.layers.LSTM(
            #     128, name="lstm_4", activation="tanh", return_sequences=True
            # ),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Activation("sigmoid"),
        )

    # inferred_features = lstm_chain

    inferred_features = tf.keras.layers.concatenate(
        [percep_chain, lstm_chain], axis=1, name="inferred_features_from_text",
    )

    # conv = tf.keras.layers.Conv1D(32, 1, use_bias=True, name="conb")(lstm)
    # inner_lstm_1 = tf.keras.layers.LSTM(32, name="inner_lstm_1", return_sequences=True)(
    #     input_lstm
    # )
    # inner_lstm_2 = tf.keras.layers.LSTM(32, name="inner_lstm_2", return_sequences=True)(
    #     inner_lstm_1
    # )
    # output_lstm = tf.keras.layers.LSTM(32, name="output_lstm")(inner_lstm_2)

    # flat = tf.keras.layers.Flatten()(conv)

    identity_predictor = subsequence(
        inferred_features,
        tf.keras.layers.Dense(
            32, name="identity_predictor_hidden_layer", activation="relu"
        ),
        tf.keras.layers.Dense(
            32, name="identity_predictor_hidden_layer_2", activation="linear"
        ),
        tf.keras.layers.Dense(
            identities_length, name="identity_predictor", activation="sigmoid",
        ),
    )

    card_type_input = tf.keras.layers.concatenate(
        [inferred_features, identity_predictor],
        axis=1,
        name="predicted_types_with_inferred_identity",
    )

    card_type_predictor = subsequence(
        card_type_input,
        tf.keras.layers.Dense(
            512, name="card_type_predictor_hidden_layer", activation="relu"
        ),
        tf.keras.layers.Dense(
            features_length, name="card_type_predictor", activation="sigmoid",
        ),
    )

    features_with_percep_chain_and_identities = tf.keras.layers.concatenate(
        [card_type_predictor, inferred_features, identity_predictor],
        axis=1,
        name="predicted_types_and_identities_with_inferred_features",
    )

    # predict the scalars based off of the features.
    scalar_predictor = subsequence(
        features_with_percep_chain_and_identities,
        tf.keras.layers.Dense(
            128, name="scalar_predictor_hidden_layer", activation="relu"
        ),
        tf.keras.layers.Dense(
            scalars_length, name="scalar_predictor", activation="relu"
        ),
    )

    model = tf.keras.models.Model(
        inputs=text_input,
        outputs=[
            identity_predictor
            # card_type_predictor,
            # scalar_predictor,
        ],
        name="mtg_scalar_and_classes_from_name",
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
        # for multi-class (e.g. multi-hot, not one-hot). use categorical_hinge
        loss={
            "identity_predictor": "binary_crossentropy",
            # "card_type_predictor": "categorical_hinge",
            # "scalar_predictor": "MSLE",
        },
        loss_weights={
            "identity_predictor": 1,
            # "card_type_predictor": 1,
            # "scalar_predictor": 1,
        },
        metrics={
            "identity_predictor": ["accuracy"],
            # "card_type_predictor": ["accuracy"],
            # "scalar_predictor": ["mean_absolute_error"],
        },
    )

    return model
