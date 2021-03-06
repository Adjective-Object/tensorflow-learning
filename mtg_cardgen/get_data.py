import requests
import lzma
import json
import os
import re
import itertools
import numpy as np
from sklearn.decomposition import PCA
import pickle

DOWNLOAD_URL_XZ = "https://www.mtgjson.com/files/AllCards.json.xz"
DATA_DIR = "data"
DOWNLOAD_PATH_XZ = os.path.join(DATA_DIR, "allCards.xz")
DOWNLOAD_PATH_JSON = os.path.join(DATA_DIR, "allCards.json")
NP_SCALARS_FILE = os.path.join(DATA_DIR, "allCards_scalars")
NP_FEATURES_FILE_PREFIX = os.path.join(DATA_DIR, "allCards_")
NP_IDENTITIES_FILE = os.path.join(DATA_DIR, "allCards_identities")
NP_INPUTS_FILE = os.path.join(DATA_DIR, "allCards_names")
SKLEARN_PCA_FILE = os.path.join(DATA_DIR, "allCards_pca.pickle")
MODEL_CONFIG_JSON_FILE = os.path.join(DATA_DIR, "modelConfig.json")
GENERIC_MANA_KEY = "__Generic"


def ensure_data_downloaded():
    if not os.path.isdir(DATA_DIR):
        os.makedirs(DATA_DIR)

    if not os.path.isfile(DOWNLOAD_PATH_JSON) and not os.path.isfile(DOWNLOAD_PATH_XZ):
        print("%s missing. downloading.." % (DOWNLOAD_PATH_XZ))
        req = requests.get(DOWNLOAD_URL_XZ)
        f = open(DOWNLOAD_PATH_XZ, "wb")
        for chunk in req.iter_content(100000):
            f.write(chunk)
        f.close()
    elif not os.path.isfile(DOWNLOAD_PATH_JSON):
        print(
            "%s missing. generating from %s." % (DOWNLOAD_PATH_JSON, DOWNLOAD_PATH_XZ)
        )
        json_str = lzma.open(DOWNLOAD_PATH_XZ)
        with open(DOWNLOAD_PATH_JSON, "wb") as f:
            f.write(json_str.read())


def lookup_map_from_set(value_set, initial_offset=0):
    sorted_values = list(value_set)
    sorted_values.sort()
    lookup_map = dict()
    for [ind, value] in enumerate(sorted_values):
        lookup_map[value] = ind + initial_offset
    return lookup_map


def split_mana_cost_string(mana_cost):
    return re.findall(r"{([^{]+)}", mana_cost)


def encode_card_intval(intstr):
    if intstr == "*":
        return -1
    elif intstr == "X":
        return -2
    elif intstr == "?":
        return -3
    elif intstr == "∞":
        return -3
    elif intstr.isnumeric():
        return int(intstr)
    elif intstr[1:].isnumeric() and intstr[0] == "-":
        return -int(intstr[1:])
    elif intstr[1:].isnumeric() and intstr[0] == "+":
        return int(intstr[1:])
    else:
        # print("ERROR ENCODING INTVAL IN CARD:", intstr)
        return 0


def get_model_parameters(all_cards):
    mana_costs = set([GENERIC_MANA_KEY])
    color_identities = set()
    basetypes = set()
    subtypes = set()
    # Tribal is a Type and not a Supertype in allcards json.
    # we consider it a supertype, so ignore it when generating types,
    # and assign it as a supertype instead.
    supertypes = set([])
    printings = set()
    namelens = dict()
    longestname = 0
    totalnamelegths = 0

    for card in all_cards.values():
        if "colorIdentity" in card:
            for color_id in card["colorIdentity"]:
                color_identities.add(color_id)

        if "manaCost" in card:
            color_costs = split_mana_cost_string(card["manaCost"])
            non_numeric_costs = filter(lambda match: not match.isnumeric(), color_costs)
            for cost in non_numeric_costs:
                mana_costs.add(cost)

        if "subtypes" in card:
            for subtype in card["subtypes"]:
                subtypes.add(subtype)

        if "supertypes" in card:
            for supertype in card["supertypes"]:
                supertypes.add(supertype)

        if "printings" in card:
            for printing in card["printings"]:
                printings.add(printing)

        if "types" in card:
            for basetype in card["types"]:
                basetypes.add(basetype)

        if "name" in card:
            namelen = len(card["name"])
            if namelen not in namelens:
                namelens[namelen] = 0
            namelens[namelen] += 1

            longestname = max(longestname, namelen)
            totalnamelegths += namelen

    print("name lengths")
    for namelen in sorted(namelens.keys()):
        print(namelen, ":", namelens[namelen])

    return {
        "longestname": longestname,
        "totalnamelegths": totalnamelegths,
        "manaCost": lookup_map_from_set(mana_costs),
        "types": lookup_map_from_set(basetypes),
        "subtypes": lookup_map_from_set(subtypes),
        "supertypes": lookup_map_from_set(supertypes),
        "printings": lookup_map_from_set(printings,),
        "color_identities": lookup_map_from_set(color_identities),
    }


def reduce_dimensionality(data):
    pca = PCA(20)
    pca.fit(data)

    pickle.dump(pca, open(SKLEARN_PCA_FILE, "wb"))

    return pca.transform(data)


def generate_numpy_from_json(all_cards):
    print("total number of unique cards:", len(all_cards))

    print("getting parameters from cards dataset")
    model_params = get_model_parameters(all_cards)

    class_params = [
        "types",
        "subtypes",
        "supertypes",
        # "printings",
    ]

    other_keys_ints = [
        "power",
        "toughness",
        "loyalty",
    ]

    model_params["class_params"] = class_params
    model_params["other_keys_ints"] = other_keys_ints

    print("converting into input/output vectors")

    allcards_values = sorted(all_cards.values(), key=lambda x: x["name"])

    input_strings = np.zeros((len(allcards_values), model_params["longestname"]))
    output_scalars = np.zeros(
        (len(allcards_values), len(model_params["manaCost"]) + len(other_keys_ints))
    )
    output_color_identities = np.zeros(
        (len(allcards_values), len(model_params["color_identities"]))
    )
    output_class_vectors = {}
    for class_param in class_params:
        feature_vector_size = len(model_params[class_param])
        output_class_vectors[class_param] = np.zeros(
            (len(allcards_values), feature_vector_size)
        )

    ind = 0
    for card in allcards_values:
        # populate input string
        ascii_name = card["name"].lower().encode("ascii", "ignore")
        name_as_char_arr = list(ascii_name)
        name_as_fl_arr = np.array(name_as_char_arr) / 128.0

        input_strings[ind, 0 : len(ascii_name)] = name_as_fl_arr

        # populate mana costs
        if "manaCost" in card:
            mana_cost = split_mana_cost_string(card["manaCost"])
            for cost_part in mana_cost:
                lookup_key = (
                    cost_part if not cost_part.isnumeric() else GENERIC_MANA_KEY
                )
                cost_part_index = model_params["manaCost"][lookup_key]
                output_scalars[ind][cost_part_index] += 1

        # populate color identities
        if "colorIdentity" in card:
            for color_id in card["colorIdentity"]:
                idx = model_params["color_identities"][color_id]
                output_color_identities[ind, idx] = 1

        # populate other scalars
        for [intKeyIndex, intKey] in enumerate(other_keys_ints):
            if intKey in card:
                output_scalars[ind][-1 - intKeyIndex] = encode_card_intval(card[intKey])

        # turn on flags for each of the enum classes
        for class_param in class_params:
            if class_param in card:
                prop = card[class_param]
                # if len(prop) == 0 and PROP_KEY_NONE in model_params[class_param]:
                #     model_params[class_param][PROP_KEY_NONE] = 1
                #     continue

                for prop_enum_val in prop:
                    prop_index = model_params[class_param][prop_enum_val]
                    output_class_vectors[class_param][ind, prop_index] = 1

        ind += 1

    # regularize output scalars
    scalar_regularization_avg = np.average(output_scalars, axis=0)
    scalar_regularization_stddev = np.std(output_scalars, axis=0)
    model_params["scalar_regularization_avg"] = list(scalar_regularization_avg)
    model_params["scalar_regularization_stddev"] = list(scalar_regularization_stddev)
    output_scalars = (
        output_scalars - scalar_regularization_avg
    ) / scalar_regularization_stddev

    print("writing outputs..")

    print("model params", json.dumps(model_params, indent=2))

    for idx in range(20, 30):
        print("cards[%s]" % idx, json.dumps(allcards_values[idx], indent=2))
        print("input_strings[%s] = " % idx, input_strings[idx])
        print("output_scalars[%s] = " % idx, output_scalars[idx])
        print("output_color_identities[%s] = " % idx, output_color_identities[idx])
        for class_param in class_params:
            print(
                "output_class_%s[%s] = " % (class_param, idx),
                output_class_vectors[class_param][idx],
            )

    np.save(NP_INPUTS_FILE, input_strings, allow_pickle=False)
    np.save(NP_SCALARS_FILE, output_scalars, allow_pickle=False)
    np.save(NP_IDENTITIES_FILE, output_color_identities, allow_pickle=False)
    for class_param in class_params:
        param_file = NP_FEATURES_FILE_PREFIX + class_param
        np.save(param_file, output_class_vectors[class_param], allow_pickle=False)

    with open(MODEL_CONFIG_JSON_FILE, "w") as f:
        f.write(json.dumps(model_params, indent=2))

    print("input_strings.shape", input_strings.shape)
    for class_param in class_params:
        print(
            "output_class_%s.shape" % class_param,
            output_class_vectors[class_param].shape,
        )
    print("output_scalars.shape", output_scalars.shape)
    print("output_color_identities.shape", output_color_identities.shape)


def get_corpus():
    ensure_data_downloaded()
    allCards = json.load(open(DOWNLOAD_PATH_JSON))
    # print("removing illegal cards")

    legalCardTypes = [
        # "Hero",
        # "Phenomenon",
        "Land",
        "Artifact",
        "Enchantment",
        "Planeswalker",
        # "Conspiracy",
        "Creature",
        "Sorcery",
        # "Scheme",
        # "Summon",
        "Tribal",
        "Instant",
        # "Plane",
    ]
    regularCards = dict(
        filter(
            lambda item: item[1]["layout"] not in ["meld", "vanguard"]
            and not any((t not in legalCardTypes for t in item[1]["types"]))
            and not any(
                (
                    weirdPrinting in item[1]["printings"]
                    # no unglued, no unhinged, no unstable, no ponies
                    for weirdPrinting in ("UGL", "UNH", "UST", "PTG")
                ),
            ),
            allCards.items(),
        )
    )

    types = set()
    for card in regularCards.values():
        for t in card["types"]:
            types.add(t)
    # print(types)

    # force tribal to be a supertype
    for [index, card] in regularCards.items():
        if "Tribal" in card["types"]:
            card["types"].remove("Tribal")
            card["supertypes"].append("Tribal")
            regularCards[index] = card
            # print("TRIBAL FIX", card)
            # print("TRIBAL FIX", regularCards[index])

    return regularCards


if __name__ == "__main__":
    regularCards = get_corpus()

    generate_numpy_from_json(regularCards)

