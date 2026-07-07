const EMBEDDING_DIMENSIONS = 64;

export function createEmbedding(text: string) {
  const vector = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

  for (const token of tokens) {
    let hash = 2166136261;
    for (const character of token) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    vector[Math.abs(hash) % EMBEDDING_DIMENSIONS] += 1;
  }

  const magnitude = Math.hypot(...vector) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

export function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}
