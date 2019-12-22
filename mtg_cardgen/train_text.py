import os
import re
import sys
import json
import math
import random
import numpy as np
import tensorflow as tf

from datetime import datetime
from text_model import build_model


def encode_names(card_strings, lookup_map):
    encoded_card_strings = []
    biggest_val = max(lookup_map.values())
    for card in card_strings:
        encoded_card = np.zeros((len(card),))
        for [i, char] in enumerate(card):
            # print(lookup_map, char, lookup_map[char], encoded_card)
            encoded_card[i] = lookup_map[char] / biggest_val

        encoded_card_strings.append(encoded_card)

    return encoded_card_strings


def create_corpus_arrays(names, sequence_length, vocab_size):
    print("building corpus from %s items" % len(names))

    corpus_sequence = np.concatenate(names)

    num_sequences = len(corpus_sequence) - sequence_length
    input_corpus_array = np.empty((num_sequences, sequence_length), dtype=int)
    output_scl_array = np.zeros((num_sequences), dtype=int)

    # copy most inputs by block
    print("  block inputs")
    cumulative_out_offset = 0
    for i in range(sequence_length):
        input_corpus_idx_end = (
            i + ((len(corpus_sequence) - i) // sequence_length) * sequence_length
        )
        # print("idx end", input_corpus_idx_end, len(corpus_sequence))
        if input_corpus_idx_end == len(corpus_sequence):
            input_corpus_idx_end -= sequence_length
        # print("idx end", input_corpus_idx_end)

        # print("input", i, input_corpus_idx_end)

        sequences_in_block = (input_corpus_idx_end - i) // sequence_length

        # print("seq in block", sequences_in_block)

        output_idx_start = cumulative_out_offset
        output_idx_end = cumulative_out_offset + sequences_in_block
        cumulative_out_offset += sequences_in_block

        # print(">>", output_idx_start, output_idx_end)

        corpus_slice = corpus_sequence[i:input_corpus_idx_end]

        # print(corpus_slice)

        input_corpus_array[
            output_idx_start:output_idx_end, 0:sequence_length
        ] = np.reshape(corpus_slice, (sequences_in_block, sequence_length))
        corp = corpus_sequence[(i + sequence_length) :: sequence_length]
        # print("corp", corp)
        output_scl_array[output_idx_start:output_idx_end] = corp

    # print("  non-block outputs")
    # # copy inputs that can't be copied by block
    # if num_sequences % sequence_length != 0:
    #     start_point = num_sequences - (
    #         (num_sequences % sequence_length) * sequence_length
    #     )
    #     for i in range(start_point, len(corpus_sequence) - sequence_length - 1):
    #         input_corpus_array[i, :] = corpus_sequence[i : i + sequence_length]
    #         output_scl_array[i, 1] = corpus_sequence[i + sequence_length]

    # print("generating output corpus", (num_sequences, vocab_size))
    # print("empty array")
    output_corpus_array = np.zeros((num_sequences, vocab_size))
    output_corpus_array[np.arange(num_sequences), output_scl_array] = 1

    # print("corpus", corpus_sequence[0:50])
    # print("input", input_corpus_array[0:50])
    # print("output_scl_array", output_scl_array[0:20])
    # print("output_corpus_array", output_corpus_array[0:20])

    # sys.exit(0)

    print("  built", input_corpus_array.shape, output_corpus_array.shape)

    return input_corpus_array, output_corpus_array


# create_corpus_arrays(
#     [
#         np.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], dtype=int),
#         np.array([7, 6, 5, 4, 3, 2, 1], dtype=int),
#     ],
#     3,
#     10,
# )


class CustomTrainingCheckpoint(tf.keras.callbacks.Callback):
    def __init__(self, filepath=""):
        self.filepath = filepath

    def on_epoch_end(self, epoch, logs):
        if not os.path.exists(self.filepath):
            os.mkdir(self.filepath)

        model_path = os.path.join(self.filepath, "trained_text_mtg_%04d.h5" % epoch)
        print("saving model for epoch %d to %s" % (epoch, model_path))
        self.model.save(model_path)


def get_latest_model(checkpoint_dir):
    if not os.path.isdir(checkpoint_dir):
        print("did not find saved model folder")
        return (None, 0)

    model_name_regex = r"trained_text_mtg_(\d+)\.h5"

    model_filenames = [
        f for f in os.listdir(checkpoint_dir) if re.match(model_name_regex, f)
    ]
    model_filenames.sort()
    model_filenames.reverse()
    if len(model_filenames) == 0:
        print("did not find any saved models")
        return (None, 0)

    while len(model_filenames) != 0:
        try:
            model_filename = model_filenames[0]
            model_path = os.path.join(checkpoint_dir, model_filename)
            print("trying to restore model from path", model_path)
            match = re.match(model_name_regex, model_filename)
            epoch_num = int(match.groups()[0])
            # model_path_no_ext = os.path.splitext(model_path)[0]
            # print("load!", model_path_no_ext)
            return (tf.keras.models.load_model(model_path), epoch_num)
        except:
            print("error loading ", model_filename)
            model_filenames = model_filenames[1:]

    print("could not load any of the saved models")
    return (None, 0)


if __name__ == "__main__":
    card_bodies_path = os.path.join(".", "data", "allCards_bodies.json")
    card_bodies_training_path = os.path.join(
        ".", "data", "allCards_bodies_validation.npy"
    )
    card_bodies_validation_path = os.path.join(
        ".", "data", "allCards_bodies_training.npy"
    )

    print("reading %s" % card_bodies_path)
    card_bodies = json.load(open(card_bodies_path, "r"))
    seen_characters = card_bodies["seen_characters"]

    if os.path.isfile(card_bodies_validation_path) and os.path.isfile(
        card_bodies_training_path
    ):
        print("reading training and validation sets from disk")
        training_set = np.load(card_bodies_training_path, allow_pickle=True)
        validation_set = np.load(card_bodies_validation_path, allow_pickle=True)
    else:
        card_bodies_data = encode_names(card_bodies["card_bodies"], seen_characters)

        print("dividing data into training and validation")
        num_in_training = int(len(card_bodies_data) * 0.8)
        random.shuffle(card_bodies_data)
        training_set = card_bodies_data[:num_in_training]
        validation_set = card_bodies_data[num_in_training:]

        print("writing training / validation sets for resuming training later")
        np.save(open(card_bodies_training_path, "wb"), training_set, allow_pickle=True)
        np.save(
            open(card_bodies_validation_path, "wb"), validation_set, allow_pickle=True
        )

    print("cards in training set:", len(training_set))
    print("cards in validation set:", len(validation_set))

    NUM_EPOCHS = 100
    SEQUENCE_LENGTH = 30
    EPOCHS_IN_META_BATCH = 3
    MAX_TRAIN_BATCH_SIZE = 500
    MAX_VALIDATION_BATCH_SIZE = 200
    VOCAB_SIZE = len(seen_characters)

    print("generating validation set")

    checkpoint_dir = os.path.join(".", "text_training_checkpoints",)
    tensorboard_logdir = os.path.join(
        ".", "text_tensorboard/logs_%s" % (datetime.now().strftime("%Y%m%d-%H%M%S"))
    )

    existing_model, initial_epoch = get_latest_model(checkpoint_dir)

    print("building checkpoint callback for path %s" % checkpoint_dir)
    checkpoint_callback = CustomTrainingCheckpoint(filepath=checkpoint_dir)
    print("building tensorboard callback for path %s" % tensorboard_logdir)
    tensorboard_callback = tf.keras.callbacks.TensorBoard(log_dir=tensorboard_logdir)

    if existing_model is None:
        print("building new model")
        model = build_model(SEQUENCE_LENGTH, VOCAB_SIZE)
    else:
        print("resuming training at", initial_epoch)
        model = existing_model

    for i in range(
        initial_epoch // EPOCHS_IN_META_BATCH,
        int(math.ceil(NUM_EPOCHS * 1.0 / EPOCHS_IN_META_BATCH)),
    ):
        print(
            "generating new training set. iteration %s/%s"
            % (i + 1, NUM_EPOCHS // EPOCHS_IN_META_BATCH)
        )
        random.shuffle(training_set)
        batch_training_set = (
            training_set[0:MAX_TRAIN_BATCH_SIZE]
            if len(training_set) > MAX_TRAIN_BATCH_SIZE
            else training_set
        )

        print(
            "generating new validation set. iteration %s/%s"
            % (i + 1, NUM_EPOCHS // EPOCHS_IN_META_BATCH)
        )
        random.shuffle(validation_set)
        validation_input, validation_output = create_corpus_arrays(
            validation_set[0:MAX_VALIDATION_BATCH_SIZE]
            if len(validation_set) > MAX_VALIDATION_BATCH_SIZE
            else validation_set,
            SEQUENCE_LENGTH,
            VOCAB_SIZE,
        )

        batch_training_input, batch_training_output = create_corpus_arrays(
            batch_training_set, SEQUENCE_LENGTH, VOCAB_SIZE
        )
        print("fitting model")
        model.fit(
            batch_training_input,
            batch_training_output,
            epochs=min((i + 1) * EPOCHS_IN_META_BATCH, NUM_EPOCHS),
            initial_epoch=max(i * EPOCHS_IN_META_BATCH, initial_epoch),
            validation_data=(validation_input, validation_output),
            callbacks=[checkpoint_callback, tensorboard_callback],
            use_multiprocessing=True,
        )

    model.save("trained_text_mtg.h5")

