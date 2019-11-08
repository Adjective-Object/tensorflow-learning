# digits

Annotated tensorflow example

Based on [Tensorflow quickstart](https://www.tensorflow.org/tutorials/quickstart/beginner) and [Text generation tutorial](https://www.tensorflow.org/tutorials/text/text_generation)

- `model.py`: declares the shape of the model
- `train_digit.py`: trains the moel and saves checkpoints in training_checkpoints
- `summarize_digit.py`: loads the model from the latest checkpoint and prints diagnostic info
- `run_digit.py`: loads the model from the latest checkpoint and reports its output for some random samples from the mnist dataset
