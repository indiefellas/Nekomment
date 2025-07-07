
<script lang="ts">
    import { onMount } from "svelte";
    import type { SafeUser } from "../../lib/sanitize";
    import Signature from "../branding/Signature.svelte";
    import Icon from "@iconify/svelte";
    import ThemeSelect from "../buttons/ThemeSelect.svelte";

    export let user: SafeUser | undefined = undefined;

    $: type = (()=>{
        switch (user?.type || 0) {
            case 0: return 'Free';
            case 1: return 'Plus';
            case 99: return 'Admin';
        }
    })();

    let menuMode = "";

    function setMenuMode(mode: string) {
        if (menuMode == mode) menuMode = "";
        else menuMode = mode;
    }

    let header: Element;
    onMount(() => {
        document.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                header.classList.add('header-scroll')
            } else {
                header.classList.remove('header-scroll')
            }
        })

        if (window.scrollY > 10) {
            header.classList.add('header-scroll')
        } else {
            header.classList.remove('header-scroll')
        }
    })
</script>
<header bind:this={header} data-menu-mode={menuMode || undefined}>
    <div class="container">
        <div class="blur-background"></div>
        <a class="main-logo" href="/" aria-label="Nekomment home page"><Signature noText /></a>
        <button class="menu-btn" aria-hidden={true} on:click={() => setMenuMode("nav")}>
            <Icon icon="material-symbols:menu-rounded" inline />
        </button>
        <div class="menu">
            <nav>
                <slot name="nav">
                    <li><a href="/about">About</a></li>
                    <li><a href="/faqs">FAQs</a></li>
                    <li><a href="/docs">API Docs</a></li>
                </slot>
            </nav>
            <div class="user-info flex-left">
                {#if user}
                    <p class="user-name">{user.name} <i>({type})</i></p>
                    {#if type === 'Admin'}
                    <a class="button primary" href="/admin">Admin</a>
                    {/if}
                    <a class="button primary" href="/dash">Dashboard</a>
                {:else}
                    <a class="button" href="/login">Login</a>
                    <a class="button primary" href="/register">Register</a>
                {/if}
                <div class="icon-buttons">
                    <button aria-label="Site options">
                        <Icon icon="lucide:cog" inline />
                    </button>
                    <button aria-label="Accessibility options">
                        <Icon icon="ion:accessibility" inline />
                    </button>
                    <ThemeSelect />
                </div>
            </div>
        </div>
        <button class="menu-close-btn" aria-hidden={!menuMode} on:click={() => setMenuMode("")}>
            <Icon icon="lucide:x" font-size="24" inline />
            <span> Close</span>
        </button>
    </div>
</header>

<style>

    header {
        position: sticky;
        top: 0;
        z-index: 1000;

        :global(&.header-scroll) {
            background-color: var(--background-2);
        }
    }
    
    .container {
        display: flex;
        flex-direction: row;
        align-items: baseline;
        justify-content: space-between;
        padding-block: 12px;

        &>* {
            z-index: 1;
        }

        a:not(.button) {
            padding: 0.35em 0.6ch;
            text-decoration: none;
        }

        a.main-logo {
            padding: 0;
            margin-right: 1ch;
            font-size: 1.2em;
            align-self: center;
        }

        nav {
            display: flex;
            flex-direction: row;
            list-style: none;
        }

        .blur-background {
            position: fixed;
            inset: 0;
            filter: blur(3px);
            z-index: 0;
            pointer-events: none;
            width: 100dvw;
            height: 100dvh;
            background: var(--background-2);
            opacity: 0;
        }
    }
    
    header[data-menu-mode="nav"] {
        .blur-background {
            opacity: 0.95;
        }
    }

    .menu {
        display: flex;
        flex-direction: row;
        align-items: baseline;
        flex-grow: 1;
    }

    .menu-btn, .menu-close-btn {
        display: none;
    }

    .user-info {
        display: flex;
        flex-direction: row;
        align-items: baseline;
        gap: 6px;

        p {
            margin-right: 0.5ch;
        }
        p i {
            color: var(--color-1);
        }
    }

    .flex-left {
        margin-inline-start: auto;
    }

    @media (max-width: 640px) {
        .container {
            height: calc(2em + 24px);
            align-items: center;
            padding-block: 0;

            a.main-logo {
                font-size: 24px;
            }
        }
        .menu {
            position: fixed;
            inset: calc(2em + 24px) 0 0 0;
            flex-direction: column;
            justify-content: space-between;
            opacity: 0;
            pointer-events: none;
            padding: 20px;
            overflow-y: auto;

            nav {
                flex-direction: column;
            }
            nav li {
                font-size: 1.5em;
                margin-block: 0.125em;
            }
            .user-info {
                flex-direction: column;
                text-align: end;
                align-items: end;
                gap: 5px;

                p {
                    margin-bottom: 5px;
                    margin-right: 0;
                    
                    i {
                        display: block;
                    }
                }
                a {
                    font-size: 1.5em;
                }
            }
        }
        .container > :is(button, button:hover, button:active) {
            padding: 0;
            background: none;
            box-shadow: none;
            transform: none;
        }
        .menu-btn, .main-logo {
            display: flex;
            align-items: center;
            height: 100%;
            & > :global(*) {
                transition: transform .5s;
            }
            overflow: hidden;
            font-size: 24px;
        }
        .container > :is(.menu-close-btn, .menu-close-btn:hover, .menu-close-btn:active) {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5ch;
            position: absolute;
            inset: 0;
        }
        .menu-close-btn {
            pointer-events: none;
            overflow: hidden;

            & > :global(*) {
                transform: translateY(calc(2em + 24px));
                transition: transform .5s;
            }
        }
        header[data-menu-mode] {
            &::before {
                opacity: 1;
                backdrop-filter: blur(0.25em);
                transition: opacity 0.5s, backdrop-filter 1s;
            }

            .menu-btn, .main-logo {
                & > :global(*) {
                    transform: translateY(calc(-2em - 24px));
                }
            }

            .menu-close-btn {
                pointer-events: all;

                & > :global(*) {
                    transform: none;
                }
            }
        }
        header[data-menu-mode="nav"] {
            .menu {
                opacity: 1;
                pointer-events: all;
            }
        }
    }
</style>