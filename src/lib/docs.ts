export type Docs = {
    value: string;
    description: string;
}

export const docs: Docs[] = [
    {
        value: 'Editor',
        description: 'The Nekomment Editor'
    },
    {
        value: 'ReplyButton',
        description: 'The button for replying to a comment'
    },
    {
        value: 'PageButtons',
        description: 'The pagination links on the bottom'
    },
    {
        value: 'name',
        description: 'Your Pages\' name'
    },
    {
        value: 'this.website',
        description: 'Website of the comment author (if there is one)'
    },
    {
        value: 'this.author',
        description: 'Name of the comment author'
    },
    {
        value: 'this.content',
        description: 'Comment content'
    },
    {
        value: 'replies',
        description: 'Replies of the specific comment (if any)'
    },
    {
        value: 'comments',
        description: 'All the comments'
    }
]