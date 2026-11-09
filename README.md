# AlkuGram Plugin Skill

Write [AlkuGram](https://t.me/alkugram) plugins with an AI assistant.

- **`PLUGIN_API.md`**: the full plugin API for JavaScript (`.js`) and exteraGram-style Python (`.plugin`) plugins on
  iPhone. Give it to ChatGPT, Claude, Gemini or any other assistant together with your task.
- **`skills/alkugram-plugin/`**: a ready skill for Claude Code and other agents that support `SKILL.md`.
- **`examples/`**: working plugins, including *Keep Reply*, which keeps the reply bar after sending in groups.

## Using it with any AI chat

1. Upload `PLUGIN_API.md` and describe the plugin, for example: “a plugin that turns `.tr text` into an English
   translation”.
2. Save the answer as `name.js`, or as `name.plugin` for the Python format.
3. Install it in AlkuGram in one of two ways:
   - **AlkuGram Settings ▸ Plugins ▸ From File**;
   - send the file to Saved Messages, touch and hold it, then tap **Install Plugin**.

## Using it with Claude Code

```bash
mkdir -p ~/.claude/skills && cp -r skills/alkugram-plugin ~/.claude/skills/
```

After that, ask Claude Code to “write an AlkuGram plugin that…”.

## Safety

AlkuGram checks every plugin's code before installing it and warns about anything risky:
- deleting the account;
- sessions or the password;
- payments;
- sending data to bots or webhooks;
- `eval` or obfuscated code;
- Python modules such as `subprocess` and `socket`.

A plugin written to `PLUGIN_API.md`'s rules installs without a warning. The check is a heuristic, not a guarantee:
install only plugins you trust.

The @AlkuHelperbot bot sends these files with `/plugins`.
