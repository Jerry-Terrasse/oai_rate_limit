// ==UserScript==
// @name         ChatGPT Rate Limit
// @namespace    http://terase.cn
// @version      2024-10-26
// @description  A tool to know your ChatGPT Rate Limit.
// @author       You
// @match        https://chatgpt.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com
// @grant        GM.xmlHttpRequest
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

var api_url = "https://oai-rl.terase.cn";
var api_key = "<the_api_key>";

function getRateLimit(model) {
    var api = `${api_url}?model=${model}`;
    GM.xmlHttpRequest({
        method: "GET",
        url: api,
        headers: {
            "Authorization": "Bearer " + api_key
        },
        onload: function(response) {
            if (response.status === 200) {
                console.log("Rate Limit Response: " + response.responseText);
            } else {
                console.log(`Rate Limit Error: ${response.status} ${response.responseText}`);
            }
        }
    });
}

setInterval(() => { getRateLimit("o1-mini"); }, 1000 * 5);

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

        if (method.toUpperCase() === 'POST') {
            if (url.endsWith("/backend-api/conversation")) {
                payload = JSON.parse(payload);
                var model = payload.model;
                
                // report to server
                var api = `${api_url}?model=${model}`;
                GM.xmlHttpRequest({
                    method: "PUT",
                    url: api,
                    headers: {
                        "Authorization": "Bearer " + api_key
                    },
                    onload: function(response) {
                        if (response.status === 200) {
                            console.log("Rate Limit Response: " + response.responseText);
                        } else {
                            console.log(`Rate Limit Error: ${response.status} ${response.responseText}`);
                        }
                    }
                });
            }
        }

        return fetch.apply(this, arguments);
    };
})(window.fetch);

})();
