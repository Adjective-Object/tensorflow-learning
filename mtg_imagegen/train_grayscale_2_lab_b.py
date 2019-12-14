from datasets import get_colorize_b_train_dataset, get_colorize_b_test_dataset
from pix2pix_training import training_session

if __name__ == "__main__":
    train_ds = get_colorize_b_train_dataset()
    test_ds = get_colorize_b_test_dataset()

    fit = training_session("_colorize_b")
    fit(
        train_ds, 150, test_ds,
    )

