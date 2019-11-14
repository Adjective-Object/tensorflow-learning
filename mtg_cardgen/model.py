import tensorflow as tf

# pulled from tutorial at
# https://www.tensorflow.org/tutorials/quickstart/beginner


def subsequence(first, *args):
    cur = first
    for arg in args:
        cur = arg(cur)

    return cur


def lstm_chain(
    name,
    inputs,
    n_layers=2,
    layer_size=32,
    per_layer_dropout=0.2,
    activation="softmax",
    output_layer_size=None,
):
    shared_inputs = (
        tf.keras.layers.concatenate(inputs) if len(inputs) > 1 else inputs[0]
    )

    members = [
        tf.keras.layers.Reshape(target_shape=(1, shared_inputs.shape[1])),
    ]
    for i in range(1, n_layers + 1):
        members.append(
            tf.keras.layers.LSTM(
                layer_size,
                name="%s_LSTM_%s" % (name, i),
                activation="tanh",
                return_sequences=True,
            )
        )
        if per_layer_dropout > 0:
            members.append(
                tf.keras.layers.Dropout(
                    per_layer_dropout, name="%s_dropout_%s" % (name, i)
                )
            )

    members.append(tf.keras.layers.Flatten())
    personal_percep_chain = subsequence(shared_inputs, *members)

    return tf.keras.layers.Dense(
        layer_size if output_layer_size is None else output_layer_size,
        name=name,
        activation=activation,
    )(personal_percep_chain)


def perceptron(
    name,
    inputs,
    n_layers=2,
    layer_size=32,
    output_layer_size=None,
    per_layer_dropout=0.2,
    activation="softmax",
):
    shared_inputs = (
        tf.keras.layers.concatenate(inputs) if len(inputs) > 1 else inputs[0]
    )

    members = []
    for i in range(1, n_layers + 1):
        members.append(
            tf.keras.layers.Dense(
                layer_size, name="%s_percep_%s" % (name, i), activation="relu"
            )
        )
        if per_layer_dropout > 0:
            members.append(
                tf.keras.layers.Dropout(
                    per_layer_dropout, name="%s_dropout_%s" % (name, i)
                )
            )

    personal_percep_chain = subsequence(shared_inputs, *members)

    return tf.keras.layers.Dense(
        layer_size if output_layer_size is None else output_layer_size,
        name=name,
        activation=activation,
    )(personal_percep_chain)


def build_model(
    input_string_length,
    identities_length,
    types_length,
    subtypes_length,
    supertypes_length,
    scalars_length,
):
    print(
        "build_model%s"
        % str(
            (
                input_string_length,
                types_length,
                subtypes_length,
                supertypes_length,
                scalars_length,
                identities_length,
            )
        )
    )

    text_input = tf.keras.Input(shape=(input_string_length,), name="text_input")

    identity_predictor = perceptron(
        "identity_predictor",  # name
        [
            # perceptron(
            #     "identity_predictor_perceptron",  # name
            #     [text_input],
            #     n_layers=3,
            #     layer_size=1024,
            #     per_layer_dropout=0.4,
            #     activation="relu",
            # ),
            lstm_chain(
                "identity_predictor_lstm",  # name
                [text_input],
                n_layers=3,
                layer_size=1024,
                output_layer_size=128,
                per_layer_dropout=0.4,
                activation="sigmoid",
            ),
        ],
        n_layers=2,
        layer_size=2048,
        per_layer_dropout=0.4,
        output_layer_size=identities_length,
    )

    subtypes_predictor = perceptron(
        "subtypes_predictor",  # name
        [text_input],
        n_layers=1,
        layer_size=8,
        per_layer_dropout=0.4,
        output_layer_size=subtypes_length,
    )

    supertypes_predictor = perceptron(
        "supertypes_predictor",  # name
        [text_input],
        n_layers=1,
        layer_size=8,
        per_layer_dropout=0.4,
        output_layer_size=supertypes_length,
    )

    type_predictor = perceptron(
        "types_predictor",
        [text_input],
        n_layers=1,
        layer_size=8,
        per_layer_dropout=0,
        output_layer_size=types_length,
    )

    scalar_predictor = perceptron(
        "scalar_predictor",
        [text_input],
        n_layers=1,
        layer_size=8,
        per_layer_dropout=0,
        output_layer_size=scalars_length,
    )

    # # predict the scalars based off of the features.
    # scalar_predictor = perceptron(
    #     "scalar_predictor",  # name
    #     [
    #         identity_predictor,
    #         perceptron(
    #             "scalar_predictor_perceptron",  # name
    #             [text_input],
    #             n_layers=2,
    #             layer_size=32,
    #             per_layer_dropout=0.2,
    #             activation="relu",
    #         ),
    #         lstm_chain(
    #             "scalar_predictor_lstm",  # name
    #             [text_input],
    #             n_layers=2,
    #             layer_size=32,
    #             per_layer_dropout=0.2,
    #             activation="sigmoid",
    #         ),
    #     ],
    #     n_layers=3,
    #     layer_size=32,
    #     per_layer_dropout=0,
    #     activation="relu",
    #     output_layer_size=scalars_length,
    # )

    for x in [
        identity_predictor,
        type_predictor,
        subtypes_predictor,
        supertypes_predictor,
        scalar_predictor,
    ]:
        print(x.shape)

    model = tf.keras.models.Model(
        inputs=text_input,
        outputs=[
            identity_predictor,
            type_predictor,
            subtypes_predictor,
            supertypes_predictor,
            scalar_predictor,
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
            "types_predictor": "binary_crossentropy",
            "supertypes_predictor": "binary_crossentropy",
            "subtypes_predictor": "binary_crossentropy",
            "scalar_predictor": "MSLE",
        },
        loss_weights={
            "identity_predictor": 1.0,
            "types_predictor": 0.0,
            "supertypes_predictor": 0.0,
            "subtypes_predictor": 0.0,  # merfolk, etc. We don't care as much about the accuracy here.
            "scalar_predictor": 0.0,
        },
        metrics={
            "identity_predictor": ["categorical_accuracy"],
            "types_predictor": ["categorical_accuracy"],
            "supertypes_predictor": ["categorical_accuracy"],
            "subtypes_predictor": ["categorical_accuracy"],
            "scalar_predictor": ["mean_absolute_error"],
        },
    )

    return model
