import os, imageio
import tensorflow as tf


for x in os.listdir("./train_data/edges_2_lab"):
    print(x)
    ds = tf.data.Dataset.list_files("./train_data/edges_2_lab/" + x)
    for x in ds.enumerate():
        pass


for x in os.listdir("./data/edges_with_lab"):
    print(x)
    ds = tf.data.Dataset.list_files("./data/edges_with_lab/" + x)
    for x in ds.enumerate():
        pass

