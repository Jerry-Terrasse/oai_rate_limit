// ==UserScript==
// @name         ChatGPT Rate Limit - Frontend
// @namespace    http://terase.cn
// @license      MIT
// @version      1.5
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
    "o1": -1,
    "o3-mini": -1,
    "gpt-4.5": -1,
}
window.devarious = {
    "o3-mini-high": "o3-mini",
    "gpt-4-5": "gpt-4.5",
}

function updateStatusText() {
    var status = window.model_status;
    var text = "";
    for (const model in status) {
        text += `${model}: ${status[model]}; `;
    }
    text = text.slice(0, -2);

    var bar = document.getElementById("crl_bar");
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
            console.log("Unexpected");
        }

        if (init) {
            method = init.method || method;
            payload = init.body || payload;
        }

        // console.log(`Request: ${method} ${url}`);

        if (method.toUpperCase() === 'POST') {
            if (url.endsWith("/backend-api/conversation")) {
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
        console.log(`Unknown model: ${msg.model}`);
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
function addFrontendItems() { // return true if freshly added
    if (document.getElementById("crl_bar")) return false;
    var avatar = document.querySelector('button[data-testid="profile-button"]');
    if (!avatar) return false;
    var avatarContainer = avatar.parentElement;

    var displayBar = htmlToNode('<div id="crl_bar">loading...</div>')
    // var refreshButton = htmlToNode('<button onclick="updateAll();"><svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4"/></svg></button>')
    
    avatarContainer.prepend(displayBar);
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

})();
