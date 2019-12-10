train-edges:
	python ./get_data.py
	mkdir -p train/edges
	python ./pix2pix-tensorflow/pix2pix.py \
		--mode train \
		--output_dir ./train/edges \
		--input_dir ./data/edges_with_lab
		--which_direction AtoB
