// Shared sendMessage helper
export function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}
