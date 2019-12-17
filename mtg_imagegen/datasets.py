import tensorflow as tf
from pix2pix_img_utils import random_jitter
from pix2pix_constants import BUFFER_SIZE, BATCH_SIZE
from pix2pix_debugger import save_model_fig

# normalizing the images to [-1, 1]
def normalize(input_image, real_image):
    input_image = (input_image / 127.5) - 1
    real_image = (real_image / 127.5) - 1

    return input_image, real_image


# loads an input/output pair from a single file
# (input on left, output on right)
def load_in_out_pair_image(image_file):
    # tf.print(image_file)
    image = tf.io.read_file(image_file)
    image = tf.image.decode_png(image)
    # tf.print(image_file, "loaded successfully", tf.shape(image))

    w = tf.shape(image)[1]

    w = w // 2
    real_image = image[:, :w, :]
    input_image = image[:, w:, :]

    input_image = tf.cast(input_image, tf.float32)
    real_image = tf.cast(real_image, tf.float32)

    # print(image_file, image, "input_image:", input_image.shape, real_image.shape)

    return real_image[:, :, 0:3], input_image[:, :, 0:3]


def load_image_train(image_file):
    input_image, real_image = load_in_out_pair_image(image_file)
    input_image, real_image = random_jitter(input_image, real_image)
    input_image, real_image = normalize(input_image, real_image)

    return input_image, real_image


def get_dataset(ds_glob):
    train_dataset = tf.data.Dataset.list_files(ds_glob)
    train_dataset = train_dataset.map(
        load_image_train, num_parallel_calls=tf.data.experimental.AUTOTUNE
    )
    train_dataset = train_dataset.shuffle(BUFFER_SIZE)
    train_dataset = train_dataset.batch(BATCH_SIZE)

    return train_dataset


def get_edges_train_dataset():
    return get_dataset("./train_data/edges_2_l/*.png")


def get_edges_test_dataset():
    return get_dataset("./test_data/edges_2_l/*.png")


def get_edges_l_hint_train_dataset():
    return get_dataset("./train_data/edges_l_hint_2_l/*.png")


def get_edges_l_hint_test_dataset():
    return get_dataset("./test_data/edges_l_hint_2_l/*.png")


def get_colorize_b_train_dataset():
    return get_dataset("./train_data/grayscale_2_color/B/*.png")


def get_colorize_b_test_dataset():
    return get_dataset("./test_data/grayscale_2_color/B/*.png")


def get_colorize_c_train_dataset():
    return get_dataset("./train_data/grayscale_2_color/C/*.png")


def get_colorize_c_test_dataset():
    return get_dataset("./test_data/grayscale_2_color/C/*.png")


def get_colorize_g_train_dataset():
    return get_dataset("./train_data/grayscale_2_color/G/*.png")


def get_colorize_g_test_dataset():
    return get_dataset("./test_data/grayscale_2_color/G/*.png")


def get_colorize_r_train_dataset():
    return get_dataset("./train_data/grayscale_2_color/R/*.png")


def get_colorize_r_test_dataset():
    return get_dataset("./test_data/grayscale_2_color/R/*.png")


def get_colorize_u_train_dataset():
    return get_dataset("./train_data/grayscale_2_color/U/*.png")


def get_colorize_u_test_dataset():
    return get_dataset("./test_data/grayscale_2_color/U/*.png")


def get_colorize_w_train_dataset():
    return get_dataset("./train_data/grayscale_2_color/W/*.png")


def get_colorize_w_test_dataset():
    return get_dataset("./test_data/grayscale_2_color/W/*.png")
