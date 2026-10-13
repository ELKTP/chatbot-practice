# AI 챗봇 (Express + OpenAI gpt-4o-mini)

이전 대화 내용을 기억하는 간단한 AI 챗봇입니다. 데이터베이스는 사용하지 않고, 대화 기록은 브라우저 메모리에 보관했다가 요청할 때마다 서버로 함께 보냅니다.

## 구조

```
chatbot/
├── server.js        # Express 서버 + /api/chat (OpenAI 호출, API 키는 여기서만 사용)
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js    # 대화 기록 관리 및 API 요청
├── .env             # OPENAI_API_KEY (Git에 올라가지 않음)
├── .env.example
└── package.json
```

## 로컬 실행

```bash
npm install
# .env 파일에 OPENAI_API_KEY=sk-... 입력
npm start
```

브라우저에서 http://localhost:3000 을 열면 됩니다.

## Vercel 배포

1. GitHub에 저장소를 올립니다. (`.env`는 `.gitignore`에 포함되어 업로드되지 않습니다.)
2. Vercel에서 저장소를 Import 합니다. Express 프로젝트로 자동 인식되며, `server.js`가 서버리스 함수로, `public/` 폴더가 정적 파일로 배포됩니다.
3. **Settings → Environment Variables**에 `OPENAI_API_KEY`를 추가한 뒤 다시 배포합니다.
