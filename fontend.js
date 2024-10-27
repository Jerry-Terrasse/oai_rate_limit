// ==UserScript==
// @name         CRL Page
// @namespace    http://terase.cn
// @version      2024-10-26
// @description  aaa
// @author       You
// @match        https://chatgpt.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com
// @sandbox      RAW
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

window.aaa = 1;
var api_url = "https://oai-rl.terase.cn";
var api_key = "<the_api_key>";

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

        console.log(`Request: ${method} ${url}`);

        if (method.toUpperCase() === 'POST') {
            if (url.endsWith("/backend-api/conversation")) {
                console.log("Conversation Request");
                payload = JSON.parse(payload);
                var model = payload.model;

                window.postMessage({ model: model, type: "put" }, window.location.origin);
            }
        }

        return fetch.apply(this, arguments);
    };
})(window.fetch);

function receiveMessage(event) {
    if (event.origin !== window.location.origin) return;

    console.log('MAIN_WORLD 收到消息:', event.data);
}

window.addEventListener('message', receiveMessage, false);

})();
