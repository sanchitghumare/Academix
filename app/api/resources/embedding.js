const EMBEDDING_DIMENSIONS = 384;

function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function normalizeText(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

export function embedText(text) {
    const normalizedText = normalizeText(text);
    const vector = new Float32Array(EMBEDDING_DIMENSIONS);

    if (!normalizedText) {
        return Array.from(vector);
    }

    const tokens = normalizedText.split(/\s+/).filter(Boolean);

    for (const token of tokens) {
        const tokenHash = hashString(token);
        const weight = 1 + Math.min(token.length, 12) / 12;

        const primaryIndex = tokenHash % EMBEDDING_DIMENSIONS;
        const secondaryIndex = (tokenHash >>> 8) % EMBEDDING_DIMENSIONS;
        const tertiaryIndex = (tokenHash >>> 16) % EMBEDDING_DIMENSIONS;

        vector[primaryIndex] += weight;
        vector[secondaryIndex] += weight * 0.5;
        vector[tertiaryIndex] += weight * 0.25;
    }

    for (let index = 0; index < normalizedText.length - 1; index += 1) {
        const gram = normalizedText.slice(index, index + 2);
        const gramHash = hashString(gram);
        vector[gramHash % EMBEDDING_DIMENSIONS] += 0.15;
    }

    let magnitude = 0;
    for (const value of vector) {
        magnitude += value * value;
    }

    if (magnitude > 0) {
        const scale = 1 / Math.sqrt(magnitude);
        for (let index = 0; index < vector.length; index += 1) {
            vector[index] *= scale;
        }
    }

    return Array.from(vector);
}