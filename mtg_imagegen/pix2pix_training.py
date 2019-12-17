import os
import sys
import time
import tensorflow as tf
from pix2pix_generator_model import Generator
from pix2pix_discriminator_model import Discriminator
from pix2pix_debugger import save_debug_ouput_fig, save_model_fig
from pix2pix_losses import discriminator_loss, generator_loss
from pix2pix_constants import CHECKPOINT_DIR, LOG_DIR, LAMBDA
from pix2pix_img_utils import resize, random_crop, random_jitter
import datetime


def training_session(dir_suffix):

    generator_optimizer = tf.keras.optimizers.Adam(2e-4, beta_1=0.5)
    discriminator_optimizer = tf.keras.optimizers.Adam(2e-4, beta_1=0.5)
    checkpoint_prefix = os.path.join(CHECKPOINT_DIR + dir_suffix, "ckpt")

    generator = Generator()
    discriminator = Discriminator()

    checkpoint = tf.train.Checkpoint(
        generator_optimizer=generator_optimizer,
        discriminator_optimizer=discriminator_optimizer,
        generator=generator,
        discriminator=discriminator,
    )

    summary_writer = tf.summary.create_file_writer(
        LOG_DIR
        + "fit"
        + dir_suffix
        + "/"
        + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    )

    @tf.function
    def train_step(input_image, target, epoch):
        with tf.GradientTape() as gen_tape, tf.GradientTape() as disc_tape:
            gen_output = generator(input_image, training=True)

            disc_real_output = discriminator([input_image, target], training=True)
            disc_generated_output = discriminator(
                [input_image, gen_output], training=True
            )

            gen_total_loss, gen_gan_loss, gen_l1_loss = generator_loss(
                disc_generated_output, gen_output, target
            )
            disc_loss = discriminator_loss(disc_real_output, disc_generated_output)

        generator_gradients = gen_tape.gradient(
            gen_total_loss, generator.trainable_variables
        )
        discriminator_gradients = disc_tape.gradient(
            disc_loss, discriminator.trainable_variables
        )

        generator_optimizer.apply_gradients(
            zip(generator_gradients, generator.trainable_variables)
        )
        discriminator_optimizer.apply_gradients(
            zip(discriminator_gradients, discriminator.trainable_variables)
        )

        with summary_writer.as_default():
            tf.summary.scalar("gen_total_loss", gen_total_loss, step=epoch)
            tf.summary.scalar("gen_gan_loss", gen_gan_loss, step=epoch)
            tf.summary.scalar("gen_l1_loss", gen_l1_loss, step=epoch)
            tf.summary.scalar("disc_loss", disc_loss, step=epoch)

        return [gen_total_loss, gen_gan_loss, gen_l1_loss, disc_loss]

    def fit(train_ds, epochs, test_ds):

        save_model_fig(generator, "generator.png")
        save_model_fig(discriminator, "discriminator.png")

        for epoch in range(epochs):
            start = time.time()

            try:
                for example_input, example_target in test_ds.take(1):
                    print("saving debug fig for epoch %s" % epoch)
                    save_debug_ouput_fig(
                        "epoch_%s%s" % (epoch, dir_suffix),
                        generator,
                        example_input,
                        example_target,
                    )
            except KeyboardInterrupt:
                exit(1)
            except:
                print("error generating debug fig. skipping", sys.exc_info())

            print("Epoch: ", epoch, "/", epochs)

            # Train
            aggregate_results = [0, 0, 0, 0]
            num_samples = 0
            for n, (input_image, target) in train_ds.enumerate():
                print(".", end="")
                sys.stdout.flush()
                if (n + 1) % 100 == 0:
                    print(int(n + 1))

                stats = train_step(input_image, target, epoch)
                for i, x in enumerate(stats):
                    aggregate_results[i] = aggregate_results[i] + x
                num_samples += 1

            with summary_writer.as_default():
                tf.summary.scalar(
                    "gen_total_loss_epoch_avg",
                    aggregate_results[0] / num_samples,
                    step=epoch,
                )
                tf.summary.scalar(
                    "gen_gan_loss_epoch_avg",
                    aggregate_results[1] / num_samples,
                    step=epoch,
                )
                tf.summary.scalar(
                    "gen_l1_loss_epoch_avg",
                    aggregate_results[2] / num_samples,
                    step=epoch,
                )
                tf.summary.scalar(
                    "disc_loss_epoch_avg",
                    aggregate_results[3] / num_samples,
                    step=epoch,
                )

            print()

            # saving (checkpoint) the model every 20 epochs
            if (epoch + 1) % 5 == 0:
                checkpoint.save(file_prefix=checkpoint_prefix)

            print(
                "Time taken for epoch {} is {} sec\n".format(
                    epoch + 1, time.time() - start
                )
            )
        checkpoint.save(file_prefix=checkpoint_prefix)

    return fit

