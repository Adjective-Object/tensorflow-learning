# mtg_imagegen

based on https://www.tensorflow.org/tutorials/generative/pix2pix

```bash
# enter venv
source ./venv/bin/activate
# possibly only needed on my machine
export LD_LIBRARY_PATH="/usr/lib64:/usr/lib:/usr/local/cuda/lib64:$LD_LIBRARY_PATH"

# download and preprocess data
python ./get_data.py

# segment datasets for training / testing
python ./segment_dataset.py ./data/edges_to_l ./train_data/edges_2_l ./test_data/edges_2_l
python ./segment_dataset.py ./data/edges_l_hint_to_l ./train_data/edges_l_hint_2_l ./test_data/edges_l_hint_2_l
python ./segment_dataset.py ./data/l_to_color/B ./train_data/grayscale_2_color/B ./test_data/grayscale_2_color/B
python ./segment_dataset.py ./data/l_to_color/C ./train_data/grayscale_2_color/C ./test_data/grayscale_2_color/C
python ./segment_dataset.py ./data/l_to_color/G ./train_data/grayscale_2_color/G ./test_data/grayscale_2_color/G
python ./segment_dataset.py ./data/l_to_color/R ./train_data/grayscale_2_color/R ./test_data/grayscale_2_color/R
python ./segment_dataset.py ./data/l_to_color/U ./train_data/grayscale_2_color/U ./test_data/grayscale_2_color/U
python ./segment_dataset.py ./data/l_to_color/W ./train_data/grayscale_2_color/W ./test_data/edges_2_color/W

#train
python ./train_edges_2_lab.py
python ./train_grayscale_2_lab_b.py
# etc


# delete samples at random
find train_data/edges_2_l | sort -R | tail -17000 | xargs rm
find train_data/edges_l_hint_2_l | sort -R | tail -17000 | xargs rm


```

## Debugging

if you see this error after a suspend

```
2019-12-14 12:07:46.806674: I tensorflow/stream_executor/cuda/cuda_gpu_executor.cc:1006] successful NUMA node read from SysFS had negative value (-1), but there must be at least one NUMA node, so returning NUMA node zero

```

it means there's some issue with CUDA. I think there's some issue with the driver where not all resources show u pafter a suspend. hard `reboot`ing fixes this.
