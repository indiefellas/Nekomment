import { Resend } from 'resend';
export class SendEmail {
    #resend;

    constructor(env: Cloudflare.Env) {
        this.#resend = new Resend(env.RESEND_KEY);
    }

    async sendEmail(name: string, email: string) {
        const { data, error } = await this.#resend.emails.send({
            from: 'Nekomment <welcome@cmt.nkko.link>',
            to: [email],
            subject: 'Welcome to Nekomment, ' + name + '!',
            html: /*html*/`
                <h1>Welcome to Nekomment, ${name}!</h1>
                <p>Here's some links to help you get started:</p>
                <a class="button big-button" href="https://cmt.nkko.link/add-host/">
                    <h3>Add your first site</h3>
                </a>
                <a class="button big-button" href="https://cmt.nkko.link/add-page/">
                    <h3>Add your first page</h3>
                </a>
                <p>You can do it now, or later, I can't force you.</p>
                <p>Cheers,<br />nkko.link team</p>
                <hr />
                <p>
                    <a href="https://cmt.nkko.link/terms">Terms of Use</a> - 
                    <a href="https://cmt.nkko.link/privacy">Privacy Policy</a>
                </p>
                <p>
                    &copy; nkko.link team, 2025; licensed under MIT license
                </p>
            `,
        });

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}