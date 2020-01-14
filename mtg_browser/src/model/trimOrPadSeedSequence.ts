const fixedSeedTail = ". ;;>";
export function trimOrPadSeedSequence(
  seedSequence: string,
  vocab: string[],
  limit: number
): string {
  if (seedSequence.length < limit) {
    const requiredSeedLength =
      limit - seedSequence.length - fixedSeedTail.length;

    const seed = [];
    for (let i = 0; i < requiredSeedLength; i++) {
      const randomCharIdx = Math.floor(Math.random() * vocab.length);
      seed.push(vocab[randomCharIdx]);
    }

    seedSequence = [...seed, fixedSeedTail, seedSequence].join("");
  }

  if (seedSequence.length > limit) {
    return seedSequence.substr(seedSequence.length - limit);
  }
  return seedSequence;
}
