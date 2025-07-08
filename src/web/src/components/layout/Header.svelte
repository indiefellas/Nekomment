
<script lang="ts">
    import { onMount } from "svelte";
    import type { SafeUser } from "../../lib/sanitize";
    import Signature from "../branding/Signature.svelte";
    import Icon from "@iconify/svelte";
    import ThemeSelect from "../buttons/ThemeSelect.svelte";
    import SiteOptions from "../buttons/SiteOptions.svelte";

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
                {:else}
                    <a class="button" href="/login">Login</a>
                    <a class="button primary" href="/register">Register</a>
                {/if}
                <div class="icon-buttons">
                    <ThemeSelect />
                    {#if user}
                        <SiteOptions />
                    {/if}
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

        .icon-buttons {
            display: flex;
            flex-direction: row;
            gap: 6px;
        }
    }
    .blur-background {
        display: none;
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
                font-size: 2em;
                line-height: 1.3;
                margin-block: 0.125em;

                a:not(.button) {
                    padding: 0;
                }
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
        .blur-background {
            display: block;
            position: fixed;
            inset: calc(2em + 24px) 0 0 0;
            opacity: 0;
            backdrop-filter: blur(0.25em);
            transition: opacity 0.3, backdrop-filter 0.3s;
            pointer-events: none;
            background: linear-gradient(20deg, transparent, var(--background-1)) top right / 1600% 100%;
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
            background-color: var(--background-2);

            .blur-background {
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