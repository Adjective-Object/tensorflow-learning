import requests
import lzma
import json
import os
import re
import sys
import shutil
import time
import imageio
import threading
import numpy as np
import scipy.ndimage
from skimage import color
import matplotlib.pyplot as plt
import cv2
from pix2pix_constants import IMG_CROP_x, IMG_CROP_y, IMG_CROP_w, IMG_CROP_h
import threading

DATA_DIR = "data"
IMAGE_DIR = os.path.join(DATA_DIR, "card_images")
CROP_DIR = os.path.join(DATA_DIR, "cropped_art")
EDGE_DIR = os.path.join(DATA_DIR, "edges")
EDGE_L_HINT_DIR = os.path.join(DATA_DIR, "edges_l_hint")
EDGE_TO_CROP_DIR = os.path.join(DATA_DIR, "edges_to_l")
EDGE_AND_L_HINT_TO_CROP_DIR = os.path.join(DATA_DIR, "edges_l_hint_to_l")
DOWNLOAD_PATH_CARDS = os.path.join(DATA_DIR, "scryfall_cards.json")
SCRYFALL_SLEEP = 0.5


def get_all_scyfall_cards():
    cards = []
    page_url = "https://api.scryfall.com/cards/search?q=%2F.*%2F+-is%3Asplit+-is%3Ameld&unique=art"
    while page_url is not None:
        print("getting page %s" % page_url)
        response = requests.get(page_url)

        if response.status_code != 200:
            print(response)

        r = response.json()
        page_url = r["next_page"] if "next_page" in r else None
        for card in r["data"]:
            cards.append(
                {
                    "id": card["id"],
                    "name": card["name"],
                    "color_id": card["color_identity"],
                }
            )

        print("cards:", len(cards), "/", r["total_cards"])
        time.sleep(SCRYFALL_SLEEP)

    return cards


def ensure_data_downloaded():
    if not os.path.isdir(DATA_DIR):
        os.makedirs(DATA_DIR)

    if not os.path.isfile(DOWNLOAD_PATH_CARDS):
        ids = get_all_scyfall_cards()
        json.dump(ids, open(DOWNLOAD_PATH_CARDS, "w"))


def get_corpus():
    ensure_data_downloaded()
    allCard_ids = json.load(open(DOWNLOAD_PATH_CARDS))

    return allCard_ids


def download_card_art(scryfall_id, out_path):
    request_url = (
        "https://api.scryfall.com/cards/%s?format=image&version=png" % scryfall_id
    )
    response = requests.get(request_url, headers={"format": "image"}, stream=True)

    if response.status_code == 200:
        with open(out_path, "wb") as f:
            response.raw.decode_content = True
            shutil.copyfileobj(response.raw, f)
    else:
        raise Exception("got invalid response!", response)

    time.sleep(SCRYFALL_SLEEP)


def crop_card_art(in_path, out_path):
    try:
        image = imageio.imread(in_path)

        imageio.imsave(
            out_path,
            image[
                IMG_CROP_y : IMG_CROP_y + IMG_CROP_h,
                IMG_CROP_x : IMG_CROP_x + IMG_CROP_w,
            ],
        )
    except KeyboardInterrupt:
        sys.exit(1)
    except:
        print("error in cropping:", sys.exc_info()[1])


def write_edge(in_path, out_path, include_light_hint=False):
    try:
        print("write_edge reading", in_path)
        image = color.rgb2lab(imageio.imread(in_path)[:, :, 0:3])

        # blurring to denoise edges from dot printing
        image[:, :, 0] = scipy.ndimage.gaussian_filter(image[:, :, 0], 0.6)
        # image[:,:,1] = scipy.ndimage.gaussian_filter(image[:,:,1], 0.6)
        # image[:,:,2] = scipy.ndimage.gaussian_filter(image[:,:,2], 0.6)

        image_uint8 = (image + [[[0, 50, 50]]]).astype(np.uint8)
        image_l = image_uint8[:, :, 0]

        # print(image[:,:,0].min(), image[:,:,0].max())
        # print(image[:,:,1].min(), image[:,:,1].max())
        # print(image[:,:,2].min(), image[:,:,2].max())

        edges_l = cv2.Canny(image_l, 60, 110).clip(0, 1)
        # results_a = cv2.Canny(image_uint8[:,:,1], 60, 110)
        # results_b = cv2.Canny(image_uint8[:,:,2], 60, 110)

        # results = np.clip(results_l + results_a + results_b, 0, 1)

        # plt.subplot(2,3,1, title="image")
        # plt.imshow(image)
        # plt.subplot(2,3,2, title="image rgb")
        # plt.imshow(color.lab2rgb(image))
        # plt.subplot(2,3,3, title="results_l")
        # plt.imshow(results_l)
        # plt.subplot(2,3,4, title="results_a")
        # plt.imshow(results_a)
        # plt.subplot(2,3,5, title="results_b")
        # plt.imshow(results_b)
        # plt.subplot(2,3,6, title="results")
        # plt.imshow(results)
        # plt.show()

        out = np.zeros((image_l.shape[0], image_l.shape[1], 3), dtype=np.uint8)
        single_channel_shape = (image_l.shape[0], image_l.shape[1], 1)

        out += edges_l.reshape(single_channel_shape) * 255
        if include_light_hint:
            out[:, :, 0] += (image_l > 65).astype(np.uint8) * 125
            out[:, :, 2] += (image_l < 25).astype(np.uint8) * 125

        out = np.clip(out, 0, 255)

        imageio.imsave(out_path, out)

    except KeyboardInterrupt:
        sys.exit(1)
    except:
        print("error in edge detection:", sys.exc_info()[1])


def write_combined_inputs_and_crop(
    crop_path, input_path, out_path, grayscale_output=True
):
    try:
        crop_img = color.rgb2lab(imageio.imread(crop_path)[:, :, 0:3])
        if grayscale_output:
            crop_img[:, :, 1] = 0
            crop_img[:, :, 2] = 0
        input_img = imageio.imread(input_path)

        if crop_img.shape[0:2] != input_img.shape[0:2]:
            raise Exception(
                "mismatched shapes on crop=%s (%s) input=%s (%s)"
                % (crop_path, crop_img.shape, input_path, input_img.shape)
            )

        crop_img_rgb = (color.lab2rgb(crop_img) * 255).astype(np.uint8)

        imageio.imsave(out_path, np.concatenate([input_img, crop_img_rgb], axis=1))

    except KeyboardInterrupt:
        sys.exit(1)
    except:
        print(
            "error in combining images %s and %s:" % (crop_path, input_path),
            sys.exc_info()[1],
        )


def write_grayscale_combined_img(input_path, out_path, grayscale_output=True):
    try:
        in_img = imageio.imread(input_path)[:, :, 0:3]

        grayscale_img = color.rgb2lab(in_img)
        grayscale_img[:, :, 1:3] = 0
        grayscale_img = (color.lab2rgb(grayscale_img) * 255).astype(np.uint8)

        imageio.imsave(out_path, np.concatenate([grayscale_img, in_img], axis=1))

    except KeyboardInterrupt:
        sys.exit(1)
    except:
        print(
            "error in writing grayscale combined images for %s:" % input_path,
            sys.exc_info()[1],
        )


def crop_and_edge_detect(card):
    card_name = card["name"]
    card_filename = "%s_%s.png" % (escaped_card_name, scryfall_id)
    img_path = os.path.join(IMAGE_DIR, card_filename)
    out_crop_path = os.path.join(CROP_DIR, card_filename)
    out_edge_path = os.path.join(EDGE_DIR, card_filename)
    out_edge_l_hint_path = os.path.join(EDGE_L_HINT_DIR, card_filename)
    out_edge_l_hint_and_crop_path = os.path.join(
        EDGE_AND_L_HINT_TO_CROP_DIR, card_filename
    )
    out_edge_and_crop_path = os.path.join(EDGE_TO_CROP_DIR, card_filename)

    if not os.path.exists(out_crop_path):
        print("  cropping %s to %s" % (card_name, out_crop_path))
        crop_card_art(img_path, out_crop_path)

    if not os.path.exists(out_edge_l_hint_path):
        print(
            "  edge detect with hint %s to %s -> %s"
            % (card_name, out_crop_path, out_edge_l_hint_path)
        )
        write_edge(out_crop_path, out_edge_l_hint_path, include_light_hint=True)

    if not os.path.exists(out_edge_path):
        print(
            '  edge detect %s to "%s" -> "%s"'
            % (card_name, out_crop_path, out_edge_path)
        )
        write_edge(out_crop_path, out_edge_path, include_light_hint=False)

    if not os.path.exists(out_edge_and_crop_path):
        print(
            "  combining %s edges with crop to %s" % (card_name, out_edge_and_crop_path)
        )
        write_combined_inputs_and_crop(
            out_crop_path, out_edge_path, out_edge_and_crop_path, grayscale_output=True,
        )

    if not os.path.exists(out_edge_l_hint_and_crop_path):
        print(
            "  combining %s edges with crop to %s"
            % (card_name, out_edge_l_hint_and_crop_path)
        )
        write_combined_inputs_and_crop(
            out_crop_path,
            out_edge_l_hint_path,
            out_edge_l_hint_and_crop_path,
            grayscale_output=True,
        )

    for color_id in ["C"] if len(card["color_id"]) == 0 else card["color_id"]:
        out_dir_color_id = os.path.join(DATA_DIR, "l_to_color", color_id)
        if not os.path.isdir(out_dir_color_id):
            os.makedirs(out_dir_color_id)

        combined_out_path = os.path.join(out_dir_color_id, card_filename)

        if not os.path.isfile(combined_out_path):
            print("  writing grayscale pair to %s" % (combined_out_path))
            write_grayscale_combined_img(
                out_crop_path, combined_out_path, grayscale_output=True,
            )


if __name__ == "__main__":
    allCards_list = get_corpus()

    for p in [
        DATA_DIR,
        IMAGE_DIR,
        CROP_DIR,
        EDGE_DIR,
        EDGE_L_HINT_DIR,
        EDGE_TO_CROP_DIR,
        EDGE_AND_L_HINT_TO_CROP_DIR,
    ]:
        if not os.path.isdir(p):
            os.makedirs(p)

    print("starting downloads")
    open_threads = []
    thread_limit = 10
    for idx, card in enumerate(allCards_list):

        card_name = card["name"]
        print("(%4d/%4d)" % (idx, len(allCards_list)), card_name)
        scryfall_id = card["id"]
        escaped_card_name = "".join(x for x in card_name if x.isalnum())
        out_path = os.path.join(
            IMAGE_DIR, "%s_%s.png" % (escaped_card_name, scryfall_id)
        )
        out_crop_path = os.path.join(
            CROP_DIR, "%s_%s.png" % (escaped_card_name, scryfall_id)
        )

        if not os.path.exists(out_path):
            print("downloading art for %s to %s" % (card_name, out_path))
            download_card_art(scryfall_id, out_path)

        if len(open_threads) >= thread_limit:
            for thread in open_threads:
                thread.join()
            open_threads = []

        new_thread = threading.Thread(target=crop_and_edge_detect, args=(card,))
        new_thread.start()
        open_threads.append(new_thread)

    for thread in open_threads:
        thread.join()

