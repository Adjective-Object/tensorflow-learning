import os
import tensorflow as tf
from model import build_model
import numpy as np
from datetime import datetime

if __name__ == "__main__":
    print("loading data")
    features = np.load(os.path.join("data", "allCards_classes.npy"), allow_pickle=False)
    names = np.load(os.path.join("data", "allCards_names.npy"), allow_pickle=False)
    scalars = np.load(os.path.join("data", "allCards_scalars.npy"), allow_pickle=False)
    identities = np.load(
        os.path.join("data", "allCards_identities.npy"), allow_pickle=False
    )

    # network is failing. Let's try overfitting and see if it works
    # names = names[20:30]
    # features = features[20:30]
    # scalars = scalars[20:30]
    # identities = identities[20:30]

    print("names.shape", names.shape)
    print(
        "features.shape", features.shape,
    )
    print("scalars.shape", scalars.shape)

    # build the model
    print("building model")
    model = build_model(
        names.shape[1], features.shape[1], scalars.shape[1], identities.shape[1]
    )
    model.summary()
    tf.keras.utils.plot_model(model, show_shapes=True, expand_nested=True)

    print("segmenting data into training & test sets at random")

    # split features into training and validation sets
    random_sample_indices = np.random.choice(
        features.shape[0], int(features.shape[0] * 0.12), replace=False
    )

    test_names = names[random_sample_indices]
    test_card_types = features[random_sample_indices]
    test_scalars = scalars[random_sample_indices]
    test_identities = identities[random_sample_indices]

    training_names = np.delete(names, random_sample_indices, axis=0)
    training_card_types = np.delete(features, random_sample_indices, axis=0)
    training_scalars = np.delete(scalars, random_sample_indices, axis=0)
    training_identities = np.delete(identities, random_sample_indices, axis=0)

    del names
    del features
    del scalars
    del identities

    print(
        "test_card_types.shape", test_card_types.shape,
    )
    print("test_names.shape", test_names.shape)
    print(
        "training_card_types.shape", training_card_types.shape,
    )
    print("training_names.shape", training_names.shape)
    print("training_identities.shape", training_identities.shape)

    # set up periodic saving of model
    checkpoint_callback = tf.keras.callbacks.ModelCheckpoint(
        filepath=os.path.join(".", "training_checkpoints", "ckpt_{epoch}"),
        save_best_only=False,
        save_weights_only=False,
    )

    tensorboard_callback = tf.keras.callbacks.TensorBoard(
        log_dir=os.path.join(
            ".", "tensorboard_logs_%s" % (datetime.now().strftime("%Y%m%d-%H%M%S"))
        )
    )

    latest_checkpoint = tf.train.latest_checkpoint(
        os.path.join(".", "training_checkpoints")
    )

    if latest_checkpoint:
        print("resuming model training from checkpoint file", latest_checkpoint)
        model.load_weights(latest_checkpoint)

    model.fit(
        training_names,  # input
        [
            training_identities,
            # training_card_types,
            # training_scalars,
        ],  # Expected outputs
        epochs=50,
        validation_data=(
            test_names,
            [
                test_identities,
                # test_scalars,
                # test_card_types,
            ],
        ),
        # batch_size=100,
        callbacks=[
            # checkpoint_callback,
            tensorboard_callback
        ],
        use_multiprocessing=True,
    )

    model.save("trained_mtg.h5")

    # model.evaluate(test_names, [test_scalars, test_card_types], verbose=2)
