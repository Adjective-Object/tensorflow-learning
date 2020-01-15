const randomPrefixBodies = [
  "<1abhorrent overlord;2{^^^^^BB};3creature - demon;4&^^^^^^;5&^^^^^^;6&;7flying\nwhen $ enters the battlefield, create a number of 1/1 black harpy creature tokens with flying equal to your devotion to black. \nat the beginning of your upkeep, sacrifice a creature.>",
  "<1abjure;2{U};3instant;4&;5&;6&;7as an additional cost to cast this spell, sacrifice a blue permanent.\ncounter target spell.>",
  '<1abnormal endurance;2{^B};3instant;4&;5&;6&;7until end of turn, target creature gets +2/+0 and gains "when this creature dies, return it to the battlefield tapped under its owner\'s control.">',
  "<1abolish;2{^WW};3instant;4&;5&;6&;7you may discard a plains card rather than pay this spell's mana cost.\ndestroy target artifact or enchantment.>",
  "<1abolisher of bloodlines;2{};3creature - eldrazi vampire;4&^^^^^^;5&^^^^^;6&;7flying\nwhen this creature transforms into $, target opponent sacrifices three creatures.>",
  "<1abominable treefolk;2{^^GU};3snow creature - treefolk;4&*;5&*;6&;7trample\n$'s power and toughness are each equal to the number of snow permanents you control.\nwhen $ enters the battlefield, tap target creature an opponent controls. that creature doesn't untap during its controller's next untap step.>"
];

const fixedSeedTail = ". ;;>";
export function trimOrPadSeedSequence(
  seedSequence: string,
  vocab: string[],
  limit: number
): string {
  if (seedSequence.length < limit) {
    const requiredSeedLength =
      limit - seedSequence.length - fixedSeedTail.length;

    let seed: string[] = [];
    while (seed.length < requiredSeedLength) {
      const randomPrefixIdx = Math.floor(
        Math.random() * randomPrefixBodies.length
      );
      seed = seed.concat(Array.from(randomPrefixBodies[randomPrefixIdx]));
    }

    if (seed.length > requiredSeedLength) {
      seed = seed.slice(seed.length - requiredSeedLength);
    }

    seedSequence = [...seed, fixedSeedTail, seedSequence].join("");
  }

  if (seedSequence.length > limit) {
    return seedSequence.substr(seedSequence.length - limit);
  }
  return seedSequence;
}
