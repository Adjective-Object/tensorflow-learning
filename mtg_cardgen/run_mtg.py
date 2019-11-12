import os
import sys
import json
import tensorflow as tf
import numpy as np
from model import build_model
import pickle

DOWNLOAD_URL_XZ = "https://www.mtgjson.com/files/AllCards.json.xz"
DATA_DIR = "data"
DOWNLOAD_PATH_XZ = os.path.join(DATA_DIR, "allCards.xz")
DOWNLOAD_PATH_JSON = os.path.join(DATA_DIR, "allCards.json")
NP_SCALARS_FILE = os.path.join(DATA_DIR, "allCards_scalars")
NP_FEATURES_FILE = os.path.join(DATA_DIR, "allCards_classes")
NP_IDENTITIES_FILE = os.path.join(DATA_DIR, "allCards_identities")
NP_INPUTS_FILE = os.path.join(DATA_DIR, "allCards_names")
SKLEARN_PCA_FILE = os.path.join(DATA_DIR, "allCards_pca.pickle")
MODEL_CONFIG_JSON_FILE = os.path.join(DATA_DIR, "modelConfig.json")
GENERIC_MANA_KEY = "__Generic"
PROP_KEY_NONE = "__None"

if __name__ == "__main__":
    model_params = json.load(open(os.path.join("data", "modelConfig.json")))

    # # Load the model
    # model = build_model(
    #     model_params["longestname"],
    #     sum(
    #         (
    #             len(model_params[enum_index])
    #             for enum_index in ["types", "subtypes", "supertypes",]
    #         )
    #     ),
    #     3 + len(model_params["manaCost"]),
    # )
    # # latest_checkpoint = tf.train.latest_checkpoint(filepath)
    # filepath = os.path.join(".", "training_checkpoints")

    # print(latest_checkpoint)
    # model.load_weights(latest_checkpoint)

    model = tf.keras.models.load_model("trained_mtg.h5")

    # line = "Negate"
    line = (
        " ".join(sys.argv[1:])
        if len(sys.argv) > 1
        else input("Name of card? (limit 33 chars): ")
    )
    ascii_name = line[0 : min(33, len(line))].lower().encode("ascii", "ignore")
    name_as_char_arr = list(ascii_name)
    name_as_fl_arr = np.array(name_as_char_arr)

    line_ints = np.zeros((1, 33))
    line_ints[:, 0 : len(ascii_name)] = name_as_fl_arr

    line_floats = line_ints / 128.0
    print("input_string", line_floats)

    scalars, features, identities = model.predict(line_floats)
    scalar_regularization_avg = np.array(model_params["scalar_regularization_avg"])
    scalar_regularization_stddev = np.array(
        model_params["scalar_regularization_stddev"]
    )

    scalars = (
        scalars.flatten() * scalar_regularization_stddev
    ) + scalar_regularization_avg
    features = features.flatten()
    identities = identities.flatten()
    # loaded_pca = pickle.load(open(SKLEARN_PCA_FILE, "rb"))

    # print("raw_features", features)

    # features = loaded_pca.inverse_transform(features)

    print("features", features)
    print("scalars", scalars)
    print("identities", identities)

    print("manaCost")

    card = dict()
    card["name"] = line

    # costs
    cost = []
    for [color, idx] in model_params["manaCost"].items():
        print(
            "  color ", color, "\t", scalars[idx], int(round(scalars[idx])),
        )
        value = int(round(scalars[idx]))
        if value <= 0:
            continue
        if color == GENERIC_MANA_KEY:
            cost.append("{%s}" % value)
        else:
            for i in range(value):
                cost.append("{%s}" % color)

    if len(cost) == 0:
        cost = ["{0}"]

    print("cost", "".join(cost))
    card["manaCost"] = "".join(sorted(cost, key=lambda x: len(x) + ord(x[1]) / 128.0))

    # color identities
    max_identity_idxes = []
    for i in range(len(model_params["color_identities"])):
        max_idx = np.argmax(identities)
        print("identities max idx:\t", max_idx, "\t", identities[max_idx])
        if i == 0:
            threshold = max(0, identities[max_idx]) ** 0.99
        # print("threshold", threshold)
        if len(max_identity_idxes) != 0 and identities[max_idx] < threshold:  # 0.05:
            break
        max_identity_idxes.append(max_idx)
        identities[max_idx] = threshold - 1

    identity_strings = []
    for [key, val] in model_params["color_identities"].items():
        for max_idx in max_identity_idxes:
            if val == max_idx:
                identity_strings.append(key)

    card["colorIdentity"] = identity_strings

    # types
    for attr in model_params["class_params"]:
        lower_bound = min(model_params[attr].values())
        upper_bound = 1 + max(model_params[attr].values())
        features_slice = features[lower_bound:upper_bound]
        # print(features_slice)
        max_idxes = []
        threshold = 0
        for i in range(0, 3):
            max_idx = np.argmax(features_slice)
            print("max idx:\t", max_idx, "\t", features_slice[max_idx])
            if i == 0:
                threshold = max(0, features_slice[max_idx]) / 2
            # print("threshold", threshold)
            if len(max_idxes) != 0 and features_slice[max_idx] < threshold:  # 0.05:
                break
            max_idxes.append(max_idx)
            features_slice[max_idx] = threshold - 1

        attr_values = []
        for [key, val] in model_params[attr].items():
            for max_idx in max_idxes:
                if val == (max_idx + lower_bound):
                    attr_values.append(key)

        print(attr, max_idx, attr_values)

        card[attr] = attr_values

    # attributes
    for [i, attr] in enumerate(model_params["other_keys_ints"]):
        attr_val = int(round((scalars[-1 - i])))
        print(attr, attr_val)
        card[attr] = attr_val

    print(json.dumps(card, indent=2))
