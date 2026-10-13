const chatEl = document.getElementById("chat");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const resetBtn = document.getElementById("reset-btn");

const GREETING = "안녕하세요! 무엇이든 물어보세요. 😊";

// 대화 기록 (DB 없이 브라우저 메모리에 보관, 매 요청마다 서버로 전송)
let messages = [];
let isLoading = false;

function addMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  wrapper.appendChild(bubble);
  chatEl.appendChild(wrapper);
  chatEl.scrollTop = chatEl.scrollHeight;
  return wrapper;
}

function showTyping() {
  const wrapper = document.createElement("div");
  wrapper.className = "message assistant";
  wrapper.innerHTML =
    '<div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
  chatEl.appendChild(wrapper);
  chatEl.scrollTop = chatEl.scrollHeight;
  return wrapper;
}

function setLoading(state) {
  isLoading = state;
  sendBtn.disabled = state;
  inputEl.disabled = state;
  if (!state) inputEl.focus();
}

function autoResize() {
  inputEl.style.height = "auto";
  inputEl.style.height = `${inputEl.scrollHeight}px`;
}

async function sendMessage(text) {
  messages.push({ role: "user", content: text });
  addMessage("user", text);
  setLoading(true);
  const typingEl = showTyping();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `서버 오류 (${res.status})`);

    typingEl.remove();
    messages.push({ role: "assistant", content: data.reply });
    addMessage("assistant", data.reply);
  } catch (err) {
    typingEl.remove();
    // 실패한 질문은 기록에서 제거해서 다음 요청에 영향이 없도록 함
    messages.pop();
    addMessage("error", `⚠️ ${err.message || "네트워크 오류가 발생했습니다."}`);
  } finally {
    setLoading(false);
  }
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text || isLoading) return;
  inputEl.value = "";
  autoResize();
  sendMessage(text);
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    formEl.requestSubmit();
  }
});

inputEl.addEventListener("input", autoResize);

resetBtn.addEventListener("click", () => {
  if (isLoading) return;
  messages = [];
  chatEl.innerHTML = "";
  addMessage("assistant", GREETING);
  inputEl.focus();
});

inputEl.focus();
