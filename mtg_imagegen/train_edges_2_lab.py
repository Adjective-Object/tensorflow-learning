from datasets import get_edges_test_dataset, get_edges_train_dataset
from pix2pix_training import training_session

if __name__ == "__main__":
    train_ds = get_edges_train_dataset()
    test_ds = get_edges_test_dataset()

    fit = training_session("_edges")
    fit(
        train_ds, 150, test_ds,
    )

