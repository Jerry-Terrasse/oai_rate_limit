// ==UserScript==
// @name         ChatGPT Rate Limit - Backend
// @namespace    http://terase.cn
// @license      MIT
// @version      1.5
// @description  A tool to know your ChatGPT Rate Limit.
// @author       Terrasse
// @match        https://chatgpt.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// @connect      oai-rl.terase.cn
// @sandbox      DOM
// ==/UserScript==

(function() {
    'use strict';

var api_url = localStorage.getItem('oairl_api_url');
var api_key = localStorage.getItem('oairl_api_key');

if (!api_url || !api_url.startsWith('https')) {
    api_url = prompt('Please enter [ChatGPT Rate Limit] API URL');
    localStorage.setItem('oairl_api_url', api_url);
}

if (!api_key || !/^[A-Za-z0-9]{32}$/.test(api_key)) {
    api_key = prompt('Please enter [ChatGPT Rate Limit] API Key (32 characters)');
    localStorage.setItem('oairl_api_key', api_key);
}

function requestAPI(model, method, onload) {
    var api = `${api_url}?model=${model}`;
    GM.xmlHttpRequest({
        method: method,
        url: api,
        headers: {
            "Authorization": "Bearer " + api_key
        },
        onload: onload
    });
}

function updateStatus(model, opposite) {
    requestAPI(model, "GET", function(response) {
        if (response.status === 200) {
            // console.log("GET success: " + response.responseText);
            var remain = JSON.parse(response.responseText).remain;
            opposite.postMessage({ model: model, type: "status", remain: remain }, window.location.origin);
        } else {
            console.log(`GET Error: ${response.status} ${response.responseText}`);
        }
    });
}

function receiveMessage(event) { // Accept: type="put" or "get"
    if (event.origin !== window.location.origin) return;
    if (event.data.type === "status") return;
    // console.log('ISOLATED_WORLD 收到消息:', event.data);

    var msg = event.data;
    if (msg.type == "put") {
        requestAPI(msg.model, "PUT", function(response) {
            if (response.status === 200) {
                // console.log("PUT success: " + response.responseText);
                updateStatus(msg.model, event.source);
            } else {
                console.log(`PUT Error: ${response.status} ${response.responseText}`);
            }
        });
    } else if (msg.type == "get") {
        updateStatus(msg.model, event.source);
    } else {
        console.log(`Unknown message type: ${msg.type}`);
    }
}

window.addEventListener('message', receiveMessage, false);

var resetKeyCounter = 0;
function resetKey() {
    if (++resetKeyCounter % 5) return; // trigger every 5 times
    if (!confirm('Are you sure to reset the API URL and Key?')) return;

    localStorage.removeItem('oairl_api_url');
    localStorage.removeItem('oairl_api_key');
    location.reload();
}

window.addEventListener('click', function(event) {
  if (event.target && event.target.id == 'crl_bar') {
    resetKey();
  }
});

})();