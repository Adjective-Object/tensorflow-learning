import requests
import lzma
import json
import os
import re
import itertools
import numpy as np

DOWNLOAD_URL_XZ = "https://www.mtgjson.com/files/AllCards.json.xz"
DATA_DIR = "data"
DOWNLOAD_PATH_XZ = os.path.join(DATA_DIR, "allCards.xz")
DOWNLOAD_PATH_JSON = os.path.join(DATA_DIR, "allCards.json")
NP_SCALARS_FILE = os.path.join(DATA_DIR, "allCards_scalars")
NP_FEATURES_FILE = os.path.join(DATA_DIR, "allCards_classes")
NP_INPUTS_FILE = os.path.join(DATA_DIR, "allCards_names")
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
    colors = set([GENERIC_MANA_KEY])
    subtypes = set()
    supertypes = set()
    printings = set()
    basetypes = set()
    namelens = dict()
    longestname = 0
    totalnamelegths = 0

    for card in all_cards.values():
        if "manaCost" in card:
            color_costs = split_mana_cost_string(card["manaCost"])
            non_numeric_costs = filter(lambda match: not match.isnumeric(), color_costs)
            for cost in non_numeric_costs:
                colors.add(cost)

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
        "colors": lookup_map_from_set(colors),
        "types": lookup_map_from_set(basetypes),
        "subtypes": lookup_map_from_set(subtypes, initial_offset=len(basetypes)),
        "supertypes": lookup_map_from_set(
            supertypes, initial_offset=len(basetypes) + len(supertypes),
        ),
        "printings": lookup_map_from_set(
            printings, initial_offset=len(basetypes) + len(supertypes) + len(colors),
        ),
    }


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

    total_classes_lengths = sum(
        (len(model_params[enum_index]) for enum_index in class_params)
    )

    other_keys_ints = [
        "power",
        "toughness",
        "loyalty",
    ]

    print("converting into input/output vectors")

    allcards_values = sorted(all_cards.values(), key=lambda x: x["name"])
    feature_vector_size = (
        total_classes_lengths + len(other_keys_ints) + model_params["longestname"]
    )
    input_strings = np.zeros((len(allcards_values), model_params["longestname"]))
    output_scalars = np.zeros(
        (len(allcards_values), len(model_params["colors"]) + len(other_keys_ints))
    )
    output_labels = np.zeros((len(allcards_values), feature_vector_size))
    output_labels[:, :] = -1

    ind = 0
    for card in allcards_values:
        # populate input string
        ascii_name = card["name"].lower().encode("ascii", "ignore")
        name_as_char_arr = np.array(ascii_name, "c")
        name_as_fl_arr = (
            name_as_char_arr.view(np.uint8).astype(np.float64) / 128
        )  # normalize input as floats between [0, 1]

        input_strings[ind, 0 : len(ascii_name)] = name_as_fl_arr

        # populate mana costs
        if "manaCost" in card:
            mana_cost = split_mana_cost_string(card["manaCost"])
            for cost_part in mana_cost:
                lookup_key = (
                    cost_part if not cost_part.isnumeric() else GENERIC_MANA_KEY
                )
                cost_part_index = model_params["colors"][lookup_key]
                output_scalars[ind][cost_part_index] += 1

        # populate other scalars
        for [intKeyIndex, intKey] in enumerate(other_keys_ints):
            if intKey in card:
                output_scalars[ind][-intKeyIndex] = encode_card_intval(card[intKey])

        # turn on flags for each of the enum classes
        for propKey in class_params:
            if propKey in card:
                prop = card[propKey]
                for prop_enum_val in prop:
                    prop_index = model_params[propKey][prop_enum_val]
                    output_labels[ind][prop_index] = 1

        ind += 1

    # regularize output scalars
    # output_scalars = output_scalars / 15.0

    print("writing outputs..")

    print("model params", json.dumps(model_params, indent=2))
    print("cards[0]", json.dumps(allcards_values[0], indent=2))
    print("input_strings[0] = ", input_strings[0])
    print("output_labels[0] = ", output_labels[0])
    print("output_scalars[0] = ", output_scalars[0])

    np.save(NP_INPUTS_FILE, input_strings, allow_pickle=False)
    np.save(NP_FEATURES_FILE, output_labels, allow_pickle=False)
    np.save(NP_SCALARS_FILE, output_scalars, allow_pickle=False)

    print("input_strings.shape", input_strings.shape)
    print("output_labels.shape", output_labels.shape)
    print("output_scalars.shape", output_scalars.shape)

    print("wrote %s, %s, %s" % (NP_INPUTS_FILE, NP_FEATURES_FILE, NP_SCALARS_FILE))


if __name__ == "__main__":
    ensure_data_downloaded()
    allCards = json.load(open(DOWNLOAD_PATH_JSON))
    print("removing illegal cards")

    regularCards = dict(
        filter(
            lambda item: not any(
                [
                    weirdPrinting in item[1]["printings"]
                    # no unglued, no unhinged, no unstable, no ponies
                    for weirdPrinting in ("UGL", "UNH", "UST", "PTG")
                ],
            ),
            allCards.items(),
        )
    )

    generate_numpy_from_json(regularCards)
