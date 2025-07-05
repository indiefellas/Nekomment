export const comments = [
    "It's kinda sad how",
    "(Oh, baby, you tell me, you're singing)",
    "Yeah, I feel you even when you're not there",
    "She's got hearts in her eyes",
    "She was rooting for me all the time",
    "Well, don't you care? I gave you everything, ah",
    "That makes you dedicate your life",
    "I'd rather see you burned alive, oh",
    "She had hearts in her eyes",
    "Aren't you tired of blending into the background? (Oh)",
    "Somehow, I don't even know what she does now",
    "It's not fair",
    "Says she hates me 'cause I'm not hers",
    "Thought she needed me, but I need her",
    "Oh, my cheerleader",
    "Her love, the type",
    "There's no doubt",
    "And she draws me kissing other guys",
    "'Cause if you're not mine",
    "Obsessed like, \"I know I can fix him\" (Oh)",
    "Cheerleader",
    "Saying, \"Boy, you better watch the time\"",
    "Now I feel you even when you're not there",
    "I can tell you're acting your heart out",
    "'Cause I knew you like the back of my hands",
    "It's not your fault you're living in a madhouse",
    "And she's addicted",
    "Where she don't know where to draw the line (Oh)",
    "Well, do I wish her the best or do I actually miss her?",
    "I can't back down"
]

export const authors = [
    "jb",
    "toasty",
    "thin"
]

function randArray<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function createRandomReplies(min: number, max: number): {
    comment: string,
    author: string
}[] {
    const numberOfItems = Math.floor(Math.random() * (max - min + 1)) + min;
    const items = [];
    for (let i = 0; i < numberOfItems; i++) {
        items.push(createRandomComment())
    }
    return items;
}

function createRandomComment() {
    return {
        comment: randArray(comments),
        author: randArray(authors),
    }
}

export function genRandomComment() {
    return {
        ...createRandomComment(),
        replies: createRandomReplies(0, 5)
    }
}