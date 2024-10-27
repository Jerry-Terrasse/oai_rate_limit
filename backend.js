// ==UserScript==
// @name         ChatGPT Rate Limit - Backend
// @namespace    http://terase.cn
// @version      2024-10-26
// @description  A tool to know your ChatGPT Rate Limit.
// @author       You
// @match        https://chatgpt.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// @connect      oai-rl.terase.cn
// @sandbox      DOM
// ==/UserScript==

(function() {
    'use strict';

var api_url = "https://oai-rl.terase.cn";
var api_key = "<the_api_key>";

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
            console.log("GET success: " + response.responseText);
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
    console.log('ISOLATED_WORLD 收到消息:', event.data);

    var msg = event.data;
    if (msg.type == "put") {
        requestAPI(msg.model, "PUT", function(response) {
            if (response.status === 200) {
                console.log("PUT success: " + response.responseText);
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

})();