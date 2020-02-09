import os, sys, re, random, json
import unicodedata
from get_data import get_corpus, lookup_map_from_set

CARD_START_CHAR = "<"
CARD_END_CHAR = ">"


def fix_him_her_their(s):
    return (
        s.replace("him or her", "their")
        .replace("her or him", "their")
        .replace("his or hers", "their")
        .replace("hers or his", "their")
        .replace(" his ", " their ")
        .replace(" hers ", " their ")
        .replace(" him ", " their ")
        .replace(" her ", " their ")
    )


def remove_extra_keywords(s):
    return s.replace(
        "as long as seven or more cards are in your graveyard", ""
    ).replace(r"if at least three \w+ mana was spent to cast ttheir spell, ", "")


def fix_aether(s):
    return s.replace("Æ", "ae").replace("æ", "ae")


def strip_accents(s):
    return (
        "".join(
            c
            for c in unicodedata.normalize("NFD", s)
            if unicodedata.category(c) != "Mn"
        )
        .replace("\u2212", "-")
        .replace("\u00ae", "")  # (r) trademarks sign
        .replace("\u00bd", "1/2")  # vulgar 1/2
        .replace("\u2014", "-")  # em dash
        .replace("\u2019", '"')  # special quote
        .replace("\u2022", "")  # bullet
    )


def remove_reminder_text(card_body):
    return re.sub(r"\([^)]*\)", "", card_body)


def carat_no(numstr):
    if numstr.isnumeric():
        return "^" * int(numstr)
    return numstr


def split_mana_cost_string(mana_cost):
    return re.findall(r"{([^{]+)}", mana_cost)


def encode_name(inp):
    return "1" + inp


def encode_cost(inp):
    costs = split_mana_cost_string(inp)
    out = []
    for cost in costs:
        pipCost = "^" * int(cost) if cost.isnumeric() else cost
        out.append(pipCost)
    return "2" + "{" + "".join(out) + "}"


def encode_type(inp):
    return "3" + inp


def encode_power(inp):
    return "4" + "&" + carat_no(inp)


def encode_toughness(inp):
    return "5" + "&" + carat_no(inp)


def encode_loyalty(inp):
    return "6" + "&" + carat_no(inp)


def encode_body(inp):
    costs = split_mana_cost_string(inp)
    for cost in costs:
        pipCost = "^" * int(cost) if cost.isnumeric() else cost
        inp = inp.replace("{" + cost + "}", "{" + pipCost.upper() + "}", 1)

    inp = inp.replace(r"}{", "")

    return "7" + inp

def replace_name_refs(body, name):
    replaced_body = body.replace(name, '$')
    if ',' in name:
        short_name = name.split(',')[0]
        replaced_body = replaced_body.replace(short_name, '$')
    return replaced_body

def generate_card_text(cards, tokenize_words):
    card_bodies = []
    seen_characters = set()
    word_counts = {}
    for card in cards.values():
        card_name = fix_him_her_their(fix_aether(strip_accents(card["name"].lower())))
        body_text = (
            remove_reminder_text(replace_name_refs(card["text"], card["name"]))
            if "text" in card
            else ""
        )
        fixed_body_text = fix_him_her_their(
            fix_aether(strip_accents(remove_extra_keywords(body_text.lower())))
        )

        for word in re.sub(
            r"[^abcdefghijklmnopqrstuvwxyz ]+", " ", fixed_body_text
        ).split(" "):
            if not word or len(word) == 1:
                continue

            if word not in word_counts:
                word_counts[word] = 0

            word_counts[word] += 1

        x = [
            encode_name(card_name),
            encode_cost(card["manaCost"] if "manaCost" in card else ""),
            encode_type(
                fix_him_her_their(fix_aether(strip_accents(card["type"].lower())))
            ),
            encode_power(card["power"] if "power" in card else ""),
            encode_toughness(card["toughness"] if "toughness" in card else ""),
            encode_loyalty(card["loyalty"] if "loyalty" in card else ""),
            encode_body(fixed_body_text),
        ]
        card_inner_text = ";".join(x)

        if CARD_START_CHAR in card_inner_text:
            print("Encountered %s in card text" % CARD_START_CHAR, card_text)
            sys.exit(1)

        if CARD_END_CHAR in card_inner_text:
            print("Encountered %s in card text" % CARD_END_CHAR, card_text)
            sys.exit(1)

        card_text = "%s%s%s" % (CARD_START_CHAR, card_inner_text, CARD_END_CHAR)
        for char in card_text:
            seen_characters.add(char)

        print(card_text)
        card_bodies.append(card_text)

    total_word_counts = sum(word_counts.values())
    word_count_threshold = total_word_counts * 0.002
    todel = []
    for word in word_counts:
        if word_counts[word] < word_count_threshold:
            todel.append(word)
    for word in todel:
        del word_counts[word]

    char_to_word_map = {}

    if tokenize_words:
        print("TOKENIZING WORDS")
        # HACK map words to hangul symbol block in seen_characters
        cur_char_code = 0x1100
        for word in word_counts:
            replacement_char = chr(cur_char_code)

            wordregex = r"(?<=([^\w]|\d))" + word + r"(?=([^\w]|;))"
            print(word, "->", replacement_char, wordregex)

            for i in range(len(card_bodies)):
                card_bodies[i] = re.sub(wordregex, replacement_char, card_bodies[i])

            seen_characters.add(replacement_char)
            char_to_word_map[replacement_char] = word

            cur_char_code += 1

    return card_bodies, lookup_map_from_set(seen_characters), char_to_word_map


if __name__ == "__main__":
    all_cards = get_corpus()

    for is_tokenized, out_fname in [
        (False, "allCards_bodies.json"),
        (True, "allCards_bodies_tokenized.json"),
    ]:
        card_bodies, seen_characters, tokens_to_strings = generate_card_text(
            all_cards, is_tokenized
        )
        out_file_path = os.path.join(".", "data", out_fname)
        out_file = open(out_file_path, "w")
        print("writing %s" % out_file_path)
        json.dump(
            {
                "card_bodies": card_bodies,
                "seen_characters": seen_characters,
                "tokens_to_strings": tokens_to_strings,
            },
            out_file,
            indent=2,
        )

