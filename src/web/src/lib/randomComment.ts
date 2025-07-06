

function randomWord(min: number, max: number) {
    const target = Math.floor(Math.random() * (max - min + 1)) + min;
    return "".padStart(target, "X");
}

function randomLine(min: number, max: number, minWord = 1, maxWord = 6) {
    const target = Math.floor(Math.random() ** 5 * (max - min + 1)) + min;
    let string = randomWord(minWord, maxWord);
    for (let i = 0; i < target; i++) {
        string += " " + randomWord(minWord, maxWord);
    }
    return string;
}

function randomParagraph(min: number, max: number, minLine = 1, maxLine = 10, minWord = 1, maxWord = 6) {
    const target = Math.floor(Math.random() ** 15 * (max - min + 1)) + min;
    let string = randomLine(minLine, maxLine, minWord, maxWord);
    for (let i = 0; i < target; i++) {
        string += " " + randomLine(minLine, maxLine, minWord, maxWord);
    }
    return string;
}

function createRandomReplies(min: number, max: number): {
    comment: string,
    author: string
}[] {
    const numberOfItems = Math.floor(Math.random() ** 3 * (max - min + 1)) + min;
    const items = [];
    for (let i = 0; i < numberOfItems; i++) {
        items.push(createRandomComment())
    }
    return items;
}

function createRandomComment() {
    return {
        comment: randomParagraph(1, 7),
        author: randomLine(1, 3, 3, 6),
    }
}

export function genRandomComment() {
    return {
        ...createRandomComment(),
        replies: createRandomReplies(0, 8)
    }
}