
<script lang="ts">
    import { onMount } from "svelte";
    import type { SafeUser } from "../../lib/sanitize";
    import Signature from "../branding/Signature.svelte";
    import Icon from "@iconify/svelte";

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
        <a class="main-logo" href="/" aria-label="Nekomment home page"><Signature noText /></a>
        <button class="menu-btn" aria-hidden={true} on:click={() => setMenuMode("nav")}>
            <Icon icon="lucide:map" inline />
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
                    <p>{user.name} <i>({type})</i></p>
                    <a class="button primary" href="/dash">Dashboard</a>
                {:else}
                    <a class="button" href="/login">Login</a>
                    <a class="button primary" href="/register">Register</a>
                {/if}
                <button aria-label="Site options">
                    <Icon icon="lucide:cog" inline />
                </button>
                <button aria-label="Accessibility options">
                    <Icon icon="ion:accessibility" inline />
                </button>
            </div>
        </div>
        <button class="menu-close-btn" aria-hidden={!menuMode} on:click={() => setMenuMode("")}>
            <Icon icon="lucide:x" font-size="24" inline />
            <span> Close</span>
        </button>
    </div>
</header>

<style scoped>
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

        p i {
            color: var(--color-1);
        }
    }

    .flex-left {
        margin-inline-start: auto;
    }

    @media (max-width: 640px) {
        header {
            order: 1;
            top: auto;
            bottom: 0;
            background: var(--background-2);
            height: calc(2em + 24px);
        }
        header::before {
            content: "";
            position: fixed;
            display: block;
            inset: 0 0 calc(2em + 24px) 0;
            opacity: 0;
            pointer-events: none;
            background: linear-gradient(160deg, transparent, var(--background-0)) bottom / 120% 400%;
            transition: opacity 0.3s, backdrop-filter 0.5s;
        }
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
            inset: 0 0 calc(2em + 24px) 0;
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