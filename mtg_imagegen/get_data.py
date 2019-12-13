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

DATA_DIR = "data"
IMAGE_DIR = os.path.join(DATA_DIR, "card_images")
CROP_DIR = os.path.join(DATA_DIR, "cropped_art")
EDGE_DIR = os.path.join(DATA_DIR, "edges")
EDGE_AND_LAB_DIR = os.path.join(DATA_DIR, "edges_with_lab")
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
                {"id": card["id"], "name": card["name"],}
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


def write_edge(in_path, out_path):
    try:
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
        out[:, :, 0] += (image_l > 65).astype(np.uint8) * 125
        out[:, :, 2] += (image_l < 25).astype(np.uint8) * 125

        out = np.clip(out, 0, 255)

        imageio.imsave(out_path, out)

    except KeyboardInterrupt:
        sys.exit(1)
    except:
        print("error in edge detection:", sys.exc_info()[1])


def write_combined_edges_and_crop(crop_path, edge_path, out_path):
    try:
        crop_img = color.rgb2lab(imageio.imread(crop_path)[:, :, 0:3])
        crop_img[:,:,1] = 0;
        crop_img[:,:,2] = 0;
        edge_img = imageio.imread(edge_path)

        if crop_img.shape[0:2] != edge_img.shape[0:2]:
            raise Exception(
                "mismatched shapes on crop=%s (%s) edge=%s (%s)"
                % (crop_path, crop_img.shape, edge_path, edge_img.shape)
            )

        crop_img_rgb = (color.lab2rgb(crop_img) * 255).astype(np.uint8)

        imageio.imsave(out_path, np.concatenate([edge_img, crop_img_rgb], axis=1))

    except KeyboardInterrupt:
        sys.exit(1)
    except:
        print("error in combining images:", sys.exc_info()[1])


def crop_and_edge_detect(card):
    card_name = card["name"]
    img_path = os.path.join(IMAGE_DIR, "%s_%s.png" % (escaped_card_name, scryfall_id))
    out_crop_path = os.path.join(
        CROP_DIR, "%s_%s.png" % (escaped_card_name, scryfall_id)
    )
    out_edge_path = os.path.join(
        EDGE_DIR, "%s_%s.png" % (escaped_card_name, scryfall_id)
    )
    out_edge_and_crop_path = os.path.join(
        EDGE_AND_LAB_DIR, "%s_%s.png" % (escaped_card_name, scryfall_id)
    )

    if not os.path.exists(out_crop_path):
        print("  cropping %s to %s" % (card_name, out_crop_path))
        crop_card_art(img_path, out_crop_path)

    if not os.path.exists(out_edge_path):
        print("  edge detect %s to %s" % (card_name, out_edge_path))
        write_edge(out_crop_path, out_edge_path)

    if not os.path.exists(out_edge_and_crop_path):
        print(
            "  combining %s edges with crop to %s" % (card_name, out_edge_and_crop_path)
        )
        write_combined_edges_and_crop(
            out_crop_path, out_edge_path, out_edge_and_crop_path
        )


if __name__ == "__main__":
    allCards_list = get_corpus()

    if not os.path.isdir(IMAGE_DIR):
        os.makedirs(IMAGE_DIR)

    if not os.path.isdir(CROP_DIR):
        os.makedirs(CROP_DIR)

    if not os.path.isdir(EDGE_DIR):
        os.makedirs(EDGE_DIR)

    if not os.path.isdir(EDGE_AND_LAB_DIR):
        os.makedirs(EDGE_AND_LAB_DIR)

    print("starting downloads")
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

        crop_and_edge_detect(card)

