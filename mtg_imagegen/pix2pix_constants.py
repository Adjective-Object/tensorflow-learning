OUTPUT_CHANNELS = 3
CHECKPOINT_DIR = "./training_checkpoints"
LOG_DIR = "logs/"
DEBUG_IMAGE_DIR = "./training_images"


IMG_CROP_x = 90
IMG_CROP_y = 125
IMG_CROP_w = 570
IMG_CROP_h = 437

# The formula to calculate the total generator loss = gan_loss + LAMBDA * l1_loss, where LAMBDA = 100. This value was decided by the authors of the paper
LAMBDA = 100

# used in training
# buffer size is the number of samples loaded at once
# batch_size is the size of each training batch
BUFFER_SIZE = 400
BATCH_SIZE = 1

NETWORK_INOUT_w = 256
NETWORK_INOUT_h = 256
