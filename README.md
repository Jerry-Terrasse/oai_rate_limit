# ChatGPT Rate Limit

A tool to know your [ChatGPT](https://chatgpt.com) Rate Limit.

## Introduction

OpenAI has a rate limit for some of their models. By now, the lastest powerful models (including `o1-preview` and `o1-mini`) have a rate limit as below<sup>[1](https://help.openai.com/en/articles/9824962-openai-o1-preview-and-o1-mini-usage-limits-on-chatgpt-and-the-api)</sup>:

> With a ChatGPT Plus or Team account, you have access to 50 messages a week with OpenAI o1-preview and 50 messages a day with OpenAI o1-mini to start. 

| Model | Rate Limit |
| --- | --- |
| `o1-preview` | 50 messages per week |
| `o1-mini` | 50 messages per day |

> Currently, there is no way to check how many messages you have used in your usage budget.

This tool is to help you know how many messages you have used, and how many messages you have left.

## Usage

This tool consists of a server based on FastAPI which will keep recording your usage, and a browser-side script based on Tampermonkey which will automatically send your usage to and fetch your usage from the server.

**Server**

1. **Prepare**:
    ```bash
    git clone https://github.com/Jerry-Terrasse/oai_rate_limit.git
    cd oai_rate_limit
    pip install -r requirements.txt
    ```
2. **Configure**: check the `config.toml` and make sure the rate limits are up-to-date.
3. **Run**: `uvicorn main:app --port 8000`

<details>

<summary>About using API key</summary>

If you wish to protect your server with a authentication, I recommend configure a `Bearer` token in your Nginx or sth.

```nginx
if ($auth_header !~* "^Bearer <your_key>$") {
    return 401;
}
```

And then don't forget to replace your key in the browser-side script `backend.js`:

```javascript
var api_key = "<the_api_key>";
```

</details>

**Browser-side script**

1. **Tampermonkey**: Install [Tampermonkey](https://www.tampermonkey.net/) in your browser.
2. **Frontend Script**: Create a new script in Tampermonkey and copy the content of `frontend.js` to the script.
3. **Backend Script**: Create a new script in Tampermonkey and copy the content of `backend.js` to the script.
   -  Replace the `api_url` in `backend.js` with your server address.
   -  (Optional) Replace the `api_key` in `backend.js` with your API key.
4. **Enjoy**: Open the ChatGPT webpage and check the usage infomation beside the avatar.