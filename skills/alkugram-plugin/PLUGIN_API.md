# AlkuGram Plugin API (iOS and Android)

This is the reference for writing AlkuGram plugins, for people and for AI agents (ChatGPT, Claude and others): give
this file to the assistant together with your task. iPhone and Android run the same API, so one plugin file works on
both. AlkuGram runs two kinds of plugin:

| Kind | File | Runs in | Best for |
| --- | --- | --- | --- |
| **JavaScript** | `name.js` with a `// @name …` header | JavaScriptCore (iPhone) or QuickJS (Android), one isolated context per plugin | new plugins, simplest API |
| **Python (exteraGram format)** | `name.plugin` with `__id__`, `__name__`, `class …(BasePlugin)` | AlkuGram's embedded Python | porting exteraGram plugins |

**Installing:** Settings ▸ AlkuGram ▸ Plugins ▸ “From File” or “From Clipboard”. You can also touch and hold a `.js` or
`.plugin` file in a chat and pick “Install Plugin”.

**Safety check:** before every install, AlkuGram reads the code. It warns about things such as deleting the account,
sessions, the password, payments, sending data to bots or webhooks, hidden code (`eval`, base64), and in Python,
modules like `subprocess`, `socket` and `os`. Plugins that do none of this install without a prompt. If a plugin
legitimately needs one of these, say so in its `@description`.

---

## 1. JavaScript plugins

### Header (required)

```js
// @name Reply Keeper
// @id reply-keeper            (optional; derived from @name)
// @version 1.0
// @description Keeps the reply bar after sending in groups
// @author your_name
```

The first 40 lines are read. Only `@name` is required; `@id` decides the file name, so a new version with the same
`@id` replaces the old one.

### Chat and message ids

- `chat.id`, `message.chatId` and `fromId` use AlkuGram's internal peer id (a 64-bit number), **not** the Bot API
  `-100…` id.
- Pass these ids back unchanged to `sendMessage`, `react`, `setKeepReply` and `setInputText`.
- `sendRequest` takes `peer` as that same number and builds the input peer itself.

### Hooks

```js
// Before a text message is sent. Return a string (replace), false (cancel), anything else (keep),
// or a Promise of one of these (awaited up to `timeout` ms, max 60000; on failure the text goes back
// into the composer).
AlkuGram.onOutgoing(function (text, chat) {
  // chat = { id, title, type: "private" | "group" | "channel" | "secret", replyToId? }
  // chat.keepReply = true;   // keep the reply bar above the composer after this message is sent
  return text;
}, { timeout: 15000 });

// Each incoming message (also while the chat is closed).
AlkuGram.onIncoming(function (message) {
  // message = { id, chatId, text, outgoing, date, chatTitle, isPrivate, fromId, fromName }
});

// An item in the message context menu (touch and hold a message).
AlkuGram.addMessageAction("Translate", function (message) { /* same message object */ });
```

### Actions

| Call | What it does |
| --- | --- |
| `AlkuGram.sendMessage(chatId, text, replyToId?)` | sends a text message |
| `AlkuGram.react(chatId, messageId, emoji)` | sets a reaction |
| `AlkuGram.setKeepReply(chatId, true/false)` | while on, the reply bar in that chat stays after every send |
| `AlkuGram.getInputText()` → Promise<string> | the text in the open chat's composer |
| `AlkuGram.setInputText(text, chatId?)` | replaces the composer text |
| `AlkuGram.sendRequest(request, cb(result, error))` | any Telegram API method as your account, see below |
| `AlkuGram.toast(text)` | a toast at the bottom of the screen |
| `AlkuGram.notify(title, text)` | a local notification |
| `AlkuGram.copy(text)` | copies to the clipboard |
| `AlkuGram.storage.get(key)` / `.set(key, value)` | per-plugin storage; it lasts until the plugin is deleted |
| `AlkuGram.getSetting(key, default)` / `AlkuGram.setSetting(key, value)` | values from the settings page (same storage) |
| `fetch(url, {method, headers, body, timeout})` | HTTP; `body` objects are sent as JSON; `res.text()`, `res.json()` |
| `setTimeout`, `clearTimeout`, `sleep(ms)` | timers; `sleep` returns a Promise |
| `console.log(...)` | goes to the app log |

`sendRequest` takes TL objects as JSON, with `_` set to the method name:

```js
AlkuGram.sendRequest({ _: "messages.sendMessage", peer: chat.id, message: "hi", random_id: Date.now() },
  function (result, error) { if (error) AlkuGram.toast(error.text || String(error)); });
// or: AlkuGram.sendRequest("messages.getHistory", { peer: chat.id, limit: 10 }, cb)
```

### Settings page and UI

```js
AlkuGram.settings([            // or a function returning rows, re-run each time the page opens
  { type: "header", text: "General" },
  { type: "switch", key: "enabled", text: "Enabled", default: true },
  { type: "input", key: "prefix", text: "Prefix", default: "." },
  { type: "selector", key: "mode", text: "Mode", items: ["A", "B"], default: 0 },
  { type: "text", text: "Open menu", onClick: function () { AlkuGram.ui.openMenu("Menu", rows); } },
  { type: "divider", text: "A footnote under the section" }
]);
await AlkuGram.ui.alert("Title", "Text");
const ok = await AlkuGram.ui.confirm("Title", "Text");      // true / false
const value = await AlkuGram.ui.prompt("Title", "Hint", "initial");  // string or null
```

### Not available

There is no file system, no access to other accounts or keys, no DOM, and no `require`/`import`. `fetch` is the only
network API.

---

## 2. Python plugins (exteraGram format)

```python
__id__ = "reply_keeper"
__name__ = "Reply Keeper"
__description__ = "Keeps the reply bar after sending in groups"
__author__ = "your_name"
__version__ = "1.0"
__min_version__ = "11.12.0"

from base_plugin import BasePlugin, HookResult, HookStrategy, MenuItemData, MenuItemType
from ui.settings import Header, Switch, Input, Selector, Text, Divider
from client_utils import send_request, send_message, send_text, set_keep_reply, get_last_fragment
from ui.bulletin import BulletinHelper

class ReplyKeeper(BasePlugin):
    def on_plugin_load(self):
        self.add_on_send_message_hook()

    def create_settings(self):
        return [Header(text="General"), Switch(key="enabled", text="Enabled", default=True)]

    def on_send_message_hook(self, account, params):
        # params.peer (dialog id, Bot API style), params.message, params.replyToMsg (MessageObject or None)
        if self.get_setting("enabled", True) and params.replyToMsg is not None:
            params.keep_reply = True       # AlkuGram: keep the reply bar after this send
            return HookResult(strategy=HookStrategy.MODIFY, params=params)
        return HookResult()
```

**Supported:**
- **Lifecycle:** `on_plugin_load`, `on_plugin_unload`, `create_settings`.
- **Settings and logging:** `get_setting` / `set_setting`, `self.log`.
- **Send hook:** `add_on_send_message_hook` with `on_send_message_hook`. Strategies: `CANCEL`, `MODIFY`,
  `MODIFY_FINAL`. Change `params.message`; set `params.keep_reply = True` to keep the reply bar.
- **Menus:** `add_menu_item(MenuItemData(menu_type=MenuItemType.MESSAGE_CONTEXT_MENU, text=…, on_click=fn))`. `fn`
  gets `{"message": MessageObject, "dialog_id": …}`.
- **`client_utils`:** `send_request(TL object or {"_": "method", …}, callback)`, `send_text(peer, text, reply)`,
  `send_message({"peer":…, "message":…})`, `edit_message`, `set_keep_reply(peer, True/False)`,
  `get_messages_controller()`.
- **Other modules:** `BulletinHelper.show_info/show_success/show_error`, `requests` (get/post), `threading.Thread`
  and `Timer`, `re`, `json`, `html`.

**Not supported (iPhone and Android alike):**
- **exteraGram's Java bridge:** any `android.*`, `java` classes through `jclass` / `dynamic_proxy`, `hook_utils`, the
  `org.telegram.ui` / `org.telegram.messenger` classes, and `add_hook` / `pre_request_hook`. AlkuGram's Python has
  no Java bridge, on Android too.
- **Python features:** `try/finally` is not supported yet; use `try/except`.

---

## 3. Rules for AI agents writing a plugin

1. Prefer **JavaScript** unless the user asks for an exteraGram `.plugin`.
2. Output **one complete file** with the header. Don't leave placeholders like `YOUR_TOKEN`; put user-specific
   values on the settings page.
3. Only call APIs listed above. Don't invent methods. For Telegram API calls, use real TL method names from
   core.telegram.org/methods.
4. Don't use `eval`, `new Function`, base64-packed code, minified lines, hard-coded bot tokens or webhook URLs. The
   safety check flags all of these, and users are told the plugin may be dangerous.
5. Catch errors and show them with `AlkuGram.toast` (JS) or `BulletinHelper.show_error` (Python). Don't fail silently.
6. Keep `onOutgoing` fast: it runs while the user waits for the message to go out. For network work, return a Promise
   and set a timeout.
7. Explain in `@description` what the plugin does, especially when it uses the network or account methods.

### Example: “keep the reply” in groups (JS)

```js
// @name Keep Reply
// @id keep-reply
// @version 1.0
// @description Keeps the reply bar after sending, so you can answer one message several times. Groups only.
// @author AlkuGram

AlkuGram.settings([
  { type: "switch", key: "groups_only", text: "Only in groups and channels", default: true }
]);

AlkuGram.onOutgoing(function (text, chat) {
  if (chat.replyToId === undefined) return text;
  if (AlkuGram.getSetting("groups_only", true) && chat.type === "private") return text;
  chat.keepReply = true;
  return text;
});
```
