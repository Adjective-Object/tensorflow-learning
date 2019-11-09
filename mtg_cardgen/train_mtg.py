import os
import tensorflow as tf
from model import build_model
import numpy as np
from datetime import datetime

if __name__ == "__main__":
    print("loading data")
    features = np.load(
        os.path.join("data", "allCards_features.npy"), allow_pickle=False
    )
    names = np.load(os.path.join("data", "allCards_names.npy"), allow_pickle=False)

    # network is failing. Let's try overfitting and see if it works
    # features = features[0:20]
    # names = names[0:20]

    print(
        "features.shape", features.shape,
    )
    print("names.shape", names.shape)

    # build the model
    print("building model")
    model = build_model(names.shape[1], features.shape[1] - names.shape[1])
    tf.keras.utils.plot_model(model, show_shapes=True, expand_nested=True)

    print("segmenting data into training & test sets at random")

    # split features into training and validation sets
    random_sample_indices = np.random.choice(
        features.shape[0], int(features.shape[0] * 0.12), replace=False
    )

    test_names = names[random_sample_indices]
    test_features = features[random_sample_indices]

    training_names = np.delete(names, random_sample_indices, axis=0)
    training_features = np.delete(features, random_sample_indices, axis=0)

    del names
    del features

    print(
        "test_features.shape", test_features.shape,
    )
    print("test_names.shape", test_names.shape)
    print(
        "training_features.shape", training_features.shape,
    )
    print("training_names.shape", training_names.shape)

    print("building model")

    # set up periodic saving of model
    checkpoint_callback = tf.keras.callbacks.ModelCheckpoint(
        filepath=os.path.join(".", "training_checkpoints", "ckpt_{epoch}"),
        # save_weights_only=True
    )

    tensorboard_callback = tf.keras.callbacks.TensorBoard(
        log_dir=os.path.join(
            ".", "tensorboard_logs_%s" % (datetime.now().strftime("%Y%m%d-%H%M%S"))
        )
    )

    NUM_BATCHES = 10
    BATCH_SIZE = 60000
    for i in range(1, NUM_BATCHES + 1):
        num_samples_in_set = training_names.shape[0]
        training_batch_idx = random_sample_indices = np.random.choice(
            num_samples_in_set, BATCH_SIZE, replace=False
        )

        batch_name_segments = training_names[training_batch_idx]
        batch_features = training_features[training_batch_idx]

        print("fitting model on batch of size %s %s/%s" % (BATCH_SIZE, i, NUM_BATCHES))
        model.fit(
            batch_name_segments,  # input
            batch_features,  # Expected outputs
            epochs=20,
            callbacks=[checkpoint_callback, tensorboard_callback],
        )

    model.evaluate(training_names, training_features, verbose=2)
