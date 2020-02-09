export interface TrainedTextConfig {
  seen_characters: Record<string, number>;
  tokens_to_strings: Record<string, string>;
}
