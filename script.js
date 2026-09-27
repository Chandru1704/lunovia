let chatHistory = [];

// Set this to the deployed Cloudflare Worker URL.
const WORKER_ENDPOINT = "https://lunovia-chat-api.lunovia.workers.dev";

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function sendQuick(text) {
  document.getElementById('user-input').value = text;
  sendMessage();
}

function addMessage(role, content, isHTML = false) {
  const box = document.getElementById('chat-box');
  const div = document.createElement('div');
  div.className = `message ${role}`;
  const avatar = document.createElement('div');
  avatar.className = role === 'bot' ? 'avatar bot' : 'avatar user-av';
  avatar.textContent = role === 'bot' ? '✦' : 'You';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (isHTML) bubble.innerHTML = content;
  else bubble.textContent = content;
  div.appendChild(avatar);
  div.appendChild(bubble);
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return bubble;
}

function addTypingIndicator() {
  const box = document.getElementById('chat-box');
  const div = document.createElement('div');
  div.className = 'message bot';
  div.id = 'typing-indicator';
  const avatar = document.createElement('div');
  avatar.className = 'avatar bot';
  avatar.textContent = '✦';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  div.appendChild(avatar);
  div.appendChild(bubble);
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function isCrisisMessage(text) {
  const keywords = ['suicide', 'self-harm', 'kill myself', 'end my life', 'hurt myself', 'self harm', "don't want to live", 'want to die'];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

async function sendMessage() {
  const input = document.getElementById('user-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';
  const sendButton = document.getElementById('send-btn');
  sendButton.disabled = true;
  addMessage('user', text);
  chatHistory.push({ role: 'user', content: text });
  addTypingIndicator();

  try {
    const response = await fetch(`${WORKER_ENDPOINT}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory.slice(0, -1) })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The service could not respond');
    const reply = data.reply || "I'm here with you. Could you tell me a little more?";
    chatHistory.push({ role: 'model', content: reply });
    removeTypingIndicator();
    addMessage('bot', reply.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'), true);

    if (isCrisisMessage(text)) {
      const box = document.getElementById('chat-box');
      const banner = document.createElement('div');
      banner.className = 'crisis-banner';
      banner.innerHTML = '🆘 <strong>If you\'re in crisis</strong>, please reach out immediately:<br>iCall (India): <strong>9152987821</strong> · NIMHANS: <strong>080-46110007</strong> · Emergency: <strong>112</strong>';
      box.appendChild(banner);
      box.scrollTop = box.scrollHeight;
    }
  } catch (err) {
    removeTypingIndicator();
    addMessage('bot', `Something went wrong: ${err.message}. Please try again.`);
  }
  sendButton.disabled = false;
  input.focus();
}
