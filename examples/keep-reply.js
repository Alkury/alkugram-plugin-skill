// @name Keep Reply
// @id keep-reply
// @version 1.0
// @description Keeps the reply bar after sending, so you can answer one message several times. Groups only by default.
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
