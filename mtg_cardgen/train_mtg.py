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

    # network is failing. Let's try overfitting and see if it works
    # features = features[0:20]
    # names = names[0:20]

    print("names.shape", names.shape)
    print(
        "features.shape", features.shape,
    )
    print("scalars.shape", scalars.shape)

    # build the model
    print("building model")
    model = build_model(names.shape[1], features.shape[1], scalars.shape[1])
    tf.keras.utils.plot_model(model, show_shapes=True, expand_nested=True)

    print("segmenting data into training & test sets at random")

    # split features into training and validation sets
    random_sample_indices = np.random.choice(
        features.shape[0], int(features.shape[0] * 0.12), replace=False
    )

    test_names = names[random_sample_indices]
    test_features = features[random_sample_indices]
    test_scalars = scalars[random_sample_indices]

    training_names = np.delete(names, random_sample_indices, axis=0)
    training_features = np.delete(features, random_sample_indices, axis=0)
    training_scalars = np.delete(scalars, random_sample_indices, axis=0)

    del names
    del features
    del scalars

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

    model.fit(
        training_names,  # input
        [training_scalars, training_features],  # Expected outputs
        epochs=50,
        callbacks=[checkpoint_callback, tensorboard_callback],
    )

    model.evaluate(test_names, [test_scalars, test_features], verbose=2)
