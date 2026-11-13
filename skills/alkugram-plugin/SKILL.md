---
name: alkugram-plugin
description: Write, fix or port AlkuGram plugins (JavaScript `.js` with a `// @name` header, or exteraGram-style Python `.plugin`) for the AlkuGram Telegram client on iPhone and Android. Use when the user asks for an AlkuGram plugin, an auto-reply/auto-format/keep-reply/command plugin, or to port an exteraGram plugin to AlkuGram.
---

# AlkuGram plugin author

You write plugins for AlkuGram (a Telegram client for iPhone and Android); the same plugin file runs on both. The
full API is in `PLUGIN_API.md` next to this file. Read it before writing code, and use only what it lists.

## Workflow

1. **Clarify the behaviour.** Find out when the plugin fires (on send, on an incoming message, from the message menu),
   in which chats, and what it changes. Ask at most one question, and only when the request cannot be built as stated.
2. **Choose the format.** JavaScript by default. Python `.plugin` only when the user asks for exteraGram format or is
   porting one.
3. **Write one complete file:**
   - the header (`@name`, `@id`, `@version`, `@description`, `@author`);
   - a settings page for anything the user may want to change;
   - errors shown with a toast.
4. **Check it against the safety rules** below. AlkuGram scans every plugin before installing and warns users about
   these patterns.
5. **Tell the user how to install it:** save it as `<id>.js` (or `.plugin`), then use Plugins ▸ From File. Another
   way is to send the file to Saved Messages, touch and hold it, and pick “Install Plugin”.

## Safety rules (the AlkuGram scanner flags these)

- No `eval`, `new Function`, `exec`, `__import__`, base64/zlib-packed code, minified or obfuscated lines.
- No hard-coded Telegram bot tokens, Bot API URLs (`api.telegram.org/bot`), Discord/webhook.site/ngrok URLs, or IP
  addresses.
- Avoid account-level methods unless that is the point of the plugin, and say so in `@description`:
  - sessions: `account.getAuthorizations`, `auth.*`;
  - password: `account.getPassword`;
  - account deletion: `account.deleteAccount`;
  - payments and gifts: `payments.*`;
  - contact exports.
- Don't send the user's messages to a server unless the plugin's purpose is that (for example, translation). If it
  is, name the server in `@description` and make it configurable.
- Python: never import `subprocess`, `socket`, `ctypes` or `shutil`, and don't call `os.system`. They don't work in
  AlkuGram's Python and are flagged as dangerous.

## Platform limits

- **One API on both platforms:** iPhone and Android run the same JS and Python API. There is no Java bridge, even
  on Android: `android.*`, `java` proxies (`jclass`, `dynamic_proxy`) and `hook_utils` fail everywhere.
- **Python hooks:** only `on_send_message_hook` and message menu items work.
- **Python syntax:** no `try/finally`.
- **Replies (iPhone and Android):** in `onOutgoing`, `chat.replyToId` is the id of the message being answered
  (missing when there is none); in Python it is `params.replyToMsg`. `AlkuGram.sendMessage(chatId, text, replyToId)`
  and `client_utils.send_text(peer, text, replyToMsg)` send a reply.
- **Keeping the reply after sending:** JS sets `chat.keepReply = true` inside `onOutgoing`, or calls
  `AlkuGram.setKeepReply(chatId, true)`. Python sets `params.keep_reply = True` or calls
  `client_utils.set_keep_reply(peer, True)`.
- **Chat ids are opaque numbers:** pass them back as received. Use `chat.type` (`private` / `group` / `channel` /
  `secret`) to tell chats apart.
