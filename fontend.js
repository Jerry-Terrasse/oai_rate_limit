// ==UserScript==
// @name         ChatGPT Rate Limit - Frontend
// @namespace    http://terase.cn
// @license      MIT
// @version      2.3
// @description  A tool to know your ChatGPT Rate Limit.
// @author       Terrasse
// @match        https://chatgpt.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com
// @sandbox      RAW
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

window.model_status = {
    "o3": -1,
    "o4-mini-high": -1,
    "o4-mini": -1,
    "GPT-4.5": -1,
}
window.devarious = {
    "gpt-4-5": "GPT-4.5",
    "4.5": "GPT-4.5",
}

function updateStatusText() {
    var status = window.model_status;
    // var text = "";
    // for (const model in status) {
    //     text += `${model}: ${status[model]}; `;
    // }
    // text = text.slice(0, -2);

    var bar = document.getElementById("crl_bar");
    var model = bar.previousElementSibling.innerText;
    if (model in window.devarious) {
        model = window.devarious[model];
    }
    var remain = "∞";
    if (model in status) {
        remain = `${status[model]}`;
    }
    var text = ` [${remain}]`;

    if (bar) {
        bar.innerText = text;
    }
}

(function(fetch) {
    window.fetch = function(input, init) {
        var method = 'GET';
        var url = '';
        var payload = null;

        if (typeof input === 'string') {
            url = input;
        } else if (input instanceof Request) {
            url = input.url;
            method = input.method || method;
            payload = input.body || null;
        } else {
            console.log(`Unexpected input of type ${typeof input}: ${input}`);
        }

        if (init) {
            method = init.method || method;
            payload = init.body || payload;
        }

        // console.log(`Request: ${method} ${url}`);

        if (method.toUpperCase() === 'POST') {
            if (url.endsWith("/backend-api/f/conversation")) {
                // console.log("Conversation Request");
                payload = JSON.parse(payload);
                var model = payload.model;
                if (model in window.devarious) {
                    model = window.devarious[model];
                }

                window.postMessage({ model: model, type: "put" }, window.location.origin);
            }
        }

        return fetch.apply(this, arguments);
    };
})(window.fetch);

function receiveMessage(event) { // Accept: type="status"
    if (event.origin !== window.location.origin) return;
    if (event.data.type !== "status") return;

    var msg = event.data;
    // console.log('MAIN_WORLD 收到消息:', msg);
    var status = window.model_status;
    if (msg.model in status) {
        status[msg.model] = msg.remain;
        updateStatusText();
    } else {
        console.log(`Unknown model from backend: ${msg.model}, msg: ${msg}, event: ${event}`, event);
    }
}

window.addEventListener('message', receiveMessage, false);

function updateAll() {
    // console.log("Update All");
    for (const model in window.model_status) {
        window.postMessage({ model: model, type: "get" }, window.location.origin);
    }
}

// Display & Refresh Button
function htmlToNode(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content.firstChild;
}
function getModelBarFlexible() {
    // there are 2 model bar (responsive), we need the visible one
    const model_bars = document.querySelectorAll("button[data-testid='model-switcher-dropdown-button']");
    for (const model_bar of model_bars) {
        // if (window.getComputedStyle(model_bar).display !== 'none') { // not working
        if (model_bar.offsetParent) { // equivalent to visible
            return model_bar;
        }
    }
    console.log("No visible model bar found", model_bars);
    return null;
}
function addFrontendItems() { // return true if freshly added
    var crl_bar = document.getElementById("crl_bar");
    if (crl_bar) {
        if (crl_bar.offsetParent === null) { // not visible
            crl_bar.remove();
            return false; // add back next time
        }
        updateStatusText();
        return false;
    }
    // var avatar = document.querySelector('button[data-testid="profile-button"]');
    // if (!avatar) return false;
    // var avatarContainer = avatar.parentElement;

    var model_bar = getModelBarFlexible();
    if (!model_bar) return false;
    model_bar = model_bar.querySelector('div');

    var displayBar = htmlToNode('<span id="crl_bar" class="text-token-text-tertiary"> [...]</span>')
    // var refreshButton = htmlToNode('<button onclick="updateAll();"><svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4"/></svg></button>')
    
    model_bar.append(displayBar);
    return true;
}
function tryAddFrontendItems() {
    if (addFrontendItems()) {
        // console.log("Frontend items added");
        updateAll();
    }
}

setInterval(updateAll, 60000); // Refresh every 60s
setInterval(tryAddFrontendItems, 200); // Make sure the bar is always there


// ====== Model Switcher ======

var mapping = {
    '1': 'GPT-4.1', // 1
    '3': 'o3', // 3
    '4': 'o4-mini-high', // 4
};

function simulateClick(element) {
    const ev = new PointerEvent('pointerdown', { bubbles: true });
    element.dispatchEvent(ev);
    const ev2 = new PointerEvent('pointerup', { bubbles: true });
    element.dispatchEvent(ev2);
}

function getModelTargets() {
    // document.querySelectorAll("div[role=menuitem]")[0].querySelector("span").textContent
    const menuItems = document.querySelectorAll('div[role=menuitem]');
    const targets = {};
    for (const item of menuItems) {
        const span = item.querySelector('span');
        if (span) {
            targets[span.textContent] = item;
        }
    }
    return targets;
}

function switchModel(target) {
    window.switch_state = 'DOING';

    // expand the model switcher
    const model_bar = getModelBarFlexible();
    simulateClick(model_bar);
    
    // try to switch
    const do_switch = setInterval(() => {
        if (window.switch_state !== 'DOING') {
            clearInterval(do_switch);
            return;
        }
        const targets = getModelTargets();
        // console.log(`do_switch: ${targets}`);
        if (target in targets) {
            // simulateClick(targets[target]);
            targets[target].click();
            console.log(`Switched to ${target}`);
            window.switch_state = 'DONE';
            clearInterval(do_switch);
        }
    }, 100);

    // try to expand the submenu
    const do_expand = setInterval(() => {
        if (window.switch_state !== 'DOING') {
            clearInterval(do_expand);
            return;
        }
        const submenu = document.querySelector('div[role=menuitem] div.grow');
        if (submenu) {
            // simulateClick(submenu);
            submenu.click();
            clearInterval(do_expand);
        }
    }, 100);

    // after 1s, if not done, fail
    setTimeout(() => {
        if (window.switch_state !== 'DONE') {
            console.log(`Failed to switch to ${target}`);
            window.switch_state = 'DONE';
        }
    }, 1000);
}

// monitor Ctrl+Shift+number
window.addEventListener('keydown', function(e) {
    // console.log(e);
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key in mapping) {
        e.preventDefault();
        e.stopPropagation();

        const target = mapping[e.key];
        console.log(`Switching to ${target}`);
        switchModel(target);
    }
});

})();
