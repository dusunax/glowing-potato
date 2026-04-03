// Word pool used by the "Don't Say It" mini-game.
// Words are common enough to appear naturally in conversation, making the game
// challenging without being unfair.
export const WORD_POOL = [
    // Animals
    'cat', 'dog', 'bird', 'fish', 'bear', 'wolf', 'fox', 'deer', 'frog', 'duck',
    'lion', 'tiger', 'rabbit', 'horse', 'cow', 'pig', 'sheep', 'chicken', 'snake', 'owl',
    // Nature
    'tree', 'flower', 'grass', 'leaf', 'sky', 'cloud', 'rain', 'snow', 'wind', 'sun',
    'moon', 'star', 'mountain', 'river', 'ocean', 'forest', 'stone', 'fire', 'water', 'earth',
    // Food
    'apple', 'orange', 'bread', 'cake', 'rice', 'soup', 'pizza', 'egg', 'milk', 'honey',
    'salt', 'pepper', 'sugar', 'lemon', 'corn', 'meat', 'bean', 'oil', 'cream', 'coffee',
    // Colors & shapes
    'red', 'blue', 'green', 'white', 'black', 'gold', 'silver', 'pink', 'dark', 'light',
    'round', 'square', 'small', 'large', 'long', 'short', 'flat', 'sharp', 'thin', 'thick',
    // Home & everyday objects
    'book', 'door', 'table', 'chair', 'window', 'floor', 'wall', 'clock', 'phone', 'key',
    'bag', 'box', 'cup', 'bowl', 'lamp', 'bed', 'hat', 'ring', 'coin', 'card',
    // Actions / verbs (noun-like usage)
    'jump', 'run', 'walk', 'sleep', 'dream', 'smile', 'laugh', 'cry', 'sing', 'dance',
    'write', 'read', 'cook', 'drive', 'swim', 'fly', 'climb', 'fall', 'hide', 'play',
    // Time & abstract
    'day', 'night', 'morning', 'year', 'month', 'week', 'hour', 'summer', 'winter', 'spring',
    'friend', 'family', 'love', 'heart', 'mind', 'hope', 'world', 'life', 'name', 'story',
];
/** Pick `count` unique random words, optionally excluding certain words. */
export function pickWords(count, exclude = []) {
    const pool = WORD_POOL.filter((w) => !exclude.includes(w));
    const result = [];
    const used = new Set();
    let attempts = 0;
    while (result.length < count && attempts < pool.length * 2) {
        const w = pool[Math.floor(Math.random() * pool.length)];
        if (!used.has(w)) {
            used.add(w);
            result.push(w);
        }
        attempts++;
    }
    return result;
}
