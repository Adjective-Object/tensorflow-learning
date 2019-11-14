import os
import tensorflow as tf
from model import build_model
import numpy as np
from datetime import datetime

if __name__ == "__main__":
    print("loading data")
    types = np.load(os.path.join("data", "allCards_types.npy"), allow_pickle=False)
    subtypes = np.load(
        os.path.join("data", "allCards_subtypes.npy"), allow_pickle=False
    )
    supertypes = np.load(
        os.path.join("data", "allCards_supertypes.npy"), allow_pickle=False
    )
    names = np.load(os.path.join("data", "allCards_names.npy"), allow_pickle=False)
    scalars = np.load(os.path.join("data", "allCards_scalars.npy"), allow_pickle=False)
    identities = np.load(
        os.path.join("data", "allCards_identities.npy"), allow_pickle=False
    )

    # network is failing. Let's try overfitting and see if it works
    names = names[20:2000]
    types = types[20:2000]
    subtypes = subtypes[20:2000]
    supertypes = supertypes[20:2000]
    scalars = scalars[20:2000]
    identities = identities[20:2000]

    print("names.shape", names.shape)
    print("types.shape", types.shape)
    print("subtypes.shape", subtypes.shape)
    print("supertypes.shape", supertypes.shape)
    print("scalars.shape", scalars.shape)

    # build the model
    print("building model")
    model = build_model(
        names.shape[1],
        identities.shape[1],
        types.shape[1],
        subtypes.shape[1],
        supertypes.shape[1],
        scalars.shape[1],
    )
    model.summary()
    tf.keras.utils.plot_model(model, show_shapes=True, expand_nested=True)

    print("segmenting data into training & test sets at random")

    # split features into training and validation sets
    random_sample_indices = np.random.choice(
        names.shape[0], int(names.shape[0] * 0.12), replace=False
    )

    test_names = names[random_sample_indices]
    test_types = types[random_sample_indices]
    test_subtypes = subtypes[random_sample_indices]
    test_supertypes = supertypes[random_sample_indices]
    test_scalars = scalars[random_sample_indices]
    test_identities = identities[random_sample_indices]

    training_names = np.delete(names, random_sample_indices, axis=0)
    training_types = np.delete(types, random_sample_indices, axis=0)
    training_subtypes = np.delete(subtypes, random_sample_indices, axis=0)
    training_supertypes = np.delete(supertypes, random_sample_indices, axis=0)
    training_scalars = np.delete(scalars, random_sample_indices, axis=0)
    training_identities = np.delete(identities, random_sample_indices, axis=0)

    del names
    del types
    del subtypes
    del supertypes
    del scalars
    del identities

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
            training_types,
            training_subtypes,
            training_supertypes,
            training_scalars,
        ],
        epochs=200,
        validation_data=(
            test_names,
            [
                test_identities,
                test_types,
                test_subtypes,
                test_supertypes,
                test_scalars,
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

    # model.evaluate(test_names, [test_scalars, test_types], verbose=2)
