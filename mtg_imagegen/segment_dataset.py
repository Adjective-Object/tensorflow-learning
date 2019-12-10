import os
import argparse
import shutil
import random

RATIO = 0.01


def get_parser():
    parser = argparse.ArgumentParser(
        description="Segment a dataset into 2 separate values"
    )
    parser.add_argument(
        "in_path", metavar="in_path", type=str, nargs=1, help="input path",
    )
    parser.add_argument(
        "training_out_path",
        metavar="training_out_path",
        type=str,
        nargs=1,
        help="output folder for training data",
    )
    parser.add_argument(
        "test_out_path",
        metavar="test_out_path",
        type=str,
        nargs=1,
        help="output folder for training data",
    )

    return parser


if __name__ == "__main__":
    args = get_parser().parse_args()

    in_path = args.in_path[0]
    training_out_path = args.training_out_path[0]
    test_out_path = args.test_out_path[0]

    if not os.path.isdir(training_out_path):
        os.makedirs(training_out_path)

    if not os.path.isdir(test_out_path):
        os.makedirs(test_out_path)

    files = os.listdir(in_path)
    for i, f in enumerate(files):
        print("(%4s/%4s) %s)" % (i + 1, len(files), f))
        in_file_path = os.path.join(in_path, f)
        out_test_path = os.path.join(training_out_path, f)
        out_train_path = os.path.join(test_out_path, f)

        is_training = random.random() > RATIO
        if is_training:
            if os.path.exists(out_test_path):
                os.remove(out_test_path)
            shutil.copy(in_file_path, out_train_path)
        else:
            if os.path.exists(out_train_path):
                os.remove(out_train_path)
            shutil.copy(in_file_path, out_test_path)
