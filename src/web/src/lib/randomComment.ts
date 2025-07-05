export const comments = [
    "hello world",
    "she neko on my comment till i submit",
    "nekomment"
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