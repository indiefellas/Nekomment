export function genId(length: number) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function genDefaultTemplate(page: string) {
    return `{{!--
    Welcome to Nekomment Pages!

    This file serves as your template to be able to use Pages,
    and here's the default configuration we serve to everyone!

    This uses the Handlebars templating language!

    This contains the necessary things to get your comment page
    up and working, and feel free to edit this whatever you want!

    For more variables and items you can put here, check out
    https://docs.beta.cmt.nkko.link/Pages/Variables

    Every page is paginated, and the buttons is below! The
    pagination logic is handled by our code so don't worry about it!

    and if you want to learn more about Handlebars, see
    https://handlebarsjs.com/guide/

    and thanks for using Nekomment!

    Issues about it? Join the Indiefellas Discord server at
    https://team.indieseas.net/discord and check #nekomment!

    Want more customization? Check out either the Nekomment JS Widget at
    https://beta.cmt.nkko.link/dash/widgets#js or the Nekomment API docs at
    https://api.beta.cmt.nkko.link/docs
--}}


<h1>{{name}}'s Comment Page</h1>
<p>This is the default Nekomment Pages layout and styling! Edit it in your dashboard!</p>

{{ Editor context }}

<section>
    {{#each comments}}
        <article>
            <h2><a href={{this.website}}>{{this.author}}</a></h2>
            <p>{{this.content}}</p>
            {{ ReplyButton this }}
            {{#each replies}}
                <blockquote>
                    <h3><a href={{this.website}}>{{this.author}}</a></h3>
                    <p>{{this.content}}</p>
                </blockquote>
            {{/each}}
        </article>
    {{/each}}
</section>

<style>
    /* See https://docs.beta.cmt.nkko.link/Pages/Styling for more info */
    @import url(/_assets/pagesDefault.css)
</style>`
}