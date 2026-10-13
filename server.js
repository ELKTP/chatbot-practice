require("dotenv").config();

const path = require("path");
const express = require("express");
const OpenAI = require("openai");

const MODEL = "gpt-4o-mini";
const MAX_HISTORY = 20; // 모델에 보낼 최근 대화 메시지 수
const MAX_MESSAGE_LENGTH = 4000;
const SYSTEM_PROMPT =
  "당신은 친절하고 유능한 AI 어시스턴트입니다. 이전 대화 내용을 참고하여 일관성 있게, 한국어로 명확하게 답변하세요.";

const app = express();
app.use(express.json({ limit: "1mb" }));

// 로컬 실행용 정적 파일 제공 (Vercel에서는 public/ 폴더가 CDN으로 제공됨)
app.use(express.static(path.join(__dirname, "public")));

// API 키는 서버(백엔드)에서만 사용
let client = null;
function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

// 클라이언트가 보낸 대화 기록을 검증하고 정리
function sanitizeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim() !== ""
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }))
    .slice(-MAX_HISTORY);
}

app.post("/api/chat", async (req, res) => {
  const openai = getClient();
  if (!openai) {
    return res
      .status(500)
      .json({ error: "서버에 OPENAI_API_KEY가 설정되지 않았습니다." });
  }

  const history = sanitizeHistory(req.body && req.body.messages);
  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return res.status(400).json({ error: "보낼 메시지가 없습니다." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "";
    res.json({ reply });
  } catch (err) {
    console.error("OpenAI API 오류:", err.status, err.message);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    const message =
      status === 401
        ? "API 키가 올바르지 않습니다."
        : status === 429
        ? "요청 한도를 초과했거나 크레딧이 부족합니다. 잠시 후 다시 시도해 주세요."
        : "AI 응답을 가져오는 중 오류가 발생했습니다.";
    res.status(status).json({ error: message });
  }
});

// 로컬에서 직접 실행할 때만 서버를 띄움 (Vercel은 export된 app을 사용)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`챗봇 서버 실행 중: http://localhost:${PORT}`);
  });
}

module.exports = app;
