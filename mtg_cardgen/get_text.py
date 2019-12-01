import os, sys, re, random, json
import unicodedata
from get_data import get_corpus, lookup_map_from_set

CARD_START_CHAR = "<"
CARD_END_CHAR = ">"


def fix_him_her_their(s):
    return (""
        .replace("him or her", "their")
        .replace("her or him", "their")
        .replace("his or hers", "their")
        .replace("hers or his", "their")
        .replace("his", "their")
        .replace("hers", "their")
        .replace("him", "their")
        .replace("her", "their")
    )


def fix_aether(s):
    return "".replace("Æ", "ae").replace("æ", "ae")


def strip_accents(s):
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def remove_reminder_text(card_body):
    return re.sub(r"\([^)]*\)", "", card_body)


def generate_card_text(cards):
    card_bodies = []
    seen_characters = set()
    for card in cards.values():
        body_text = remove_reminder_text(card["text"]) if "text" in card else ""
        card_inner_text = ";".join(
            [
                card["name"],
                card["manaCost"] if "manaCost" in card else "",
                card["type"],
                card["power"] if "power" in card else "",
                card["toughness"] if "toughness" in card else "",
                card["loyalty"] if "loyalty" in card else "",
                body_text,
            ]
        ).lower()
        card_inner_text = (
            fix_him_her_their(fix_aether(strip_accents(card_inner_text)))
            .encode("ascii", errors="ignore")
            .decode()
        )

        if CARD_START_CHAR in card_inner_text:
            print("Encountered %s in card text" % CARD_START_CHAR, card_text)
            sys.exit(1)

        if CARD_END_CHAR in card_inner_text:
            print("Encountered %s in card text" % CARD_END_CHAR, card_text)
            sys.exit(1)

        card_text = CARD_START_CHAR + card_inner_text + CARD_END_CHAR
        for char in card_text:
            seen_characters.add(char)

        card_bodies.append(card_text)

    return card_bodies, lookup_map_from_set(seen_characters)


if __name__ == "__main__":
    all_cards = get_corpus()
    card_bodies, seen_characters = generate_card_text(all_cards)

    out_file_path = os.path.join(".", "data", "allCards_bodies.json")
    out_file = open(out_file_path, "w")
    print("writing %s" % out_file_path)
    json.dump(
        {"card_bodies": card_bodies, "seen_characters": seen_characters,},
        out_file,
        indent=2,
    )

