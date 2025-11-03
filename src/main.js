import './style.css'

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="chatbot">
    <h1>차량 추천 챗봇</h1>
    <div id="chat" class="chat-window"></div>
    <form id="chat-form" class="chat-form">
      <input id="user-input" type="text" placeholder="예: 4인 가족, 예산 3천만원, 연비 중요" autocomplete="off" />
      <button type="submit">전송</button>
    </form>
    <p class="hint">.env에 VITE_OPENAI_API_KEY를 설정하세요. Netlify에 동일 키를 환경 변수로 추가하세요.</p>
  </div>
`

const chatWindow = document.getElementById('chat')
const form = document.getElementById('chat-form')
const input = document.getElementById('user-input')

const apiKey = import.meta.env.VITE_OPENAI_API_KEY
const apiUrl = 'https://api.openai.com/v1/chat/completions'
const model = 'gpt-4o-mini'

// simple client-side memory/state
const conversation = []
let remainingQuestions = 2

function appendMessage(sender, text) {
  const bubble = document.createElement('div')
  bubble.className = `msg ${sender}`
  bubble.textContent = text
  chatWindow.appendChild(bubble)
  chatWindow.scrollTop = chatWindow.scrollHeight
}

function getSystemPrompt(remaining) {
  return [
    '당신은 자동차 구매 컨설턴트입니다.',
    '목표: 사용자의 요구를 파악해 3가지 차량 후보를 제안합니다.',
    `추가 질문은 최대 ${remaining}개까지 허용되며, 한 번에 하나씩만 물어보세요.`,
    '정보가 충분하거나 질문 횟수를 모두 사용했다면, 더 이상 질문하지 말고 최종 결과를 출력하세요.',
    '최종 결과 출력 형식(JSON 아님, 깔끔한 텍스트):',
    '최종 추천\n'
      + '1) [차종 · 대표 모델]\n'
      + '   - 재원: (엔진/모터, 출력, 구동, 크기 등 핵심)\n'
      + '   - 특징: (2-3개 불릿)\n'
      + '   - 트렌드: (해당 세그먼트/파워트레인 동향 1-2개)\n'
      + '   - 가격: (대략적인 신차가 범위)\n'
      + '   - 추천하는 이유: (사용자 요구와의 정합성 2-3개)\n'
      + '2) ...\n'
      + '3) ...\n'
      + '마무리: 적합도 요약 및 다음 단계(시승/트림 선택 등) 1-2줄',
    '질문 단계에서는 반드시 한 문단(1문장~2문장)으로만 질문하세요.',
  ].join('\n')
}

function looksLikeAQuestion(text) {
  if (!text) return false
  const t = text.trim()
  return t.endsWith('?') || /\?/.test(t) || /(무엇|어떤|어떻게|몇|원하시|필요)/.test(t)
}

async function requestCompletion(forceFinal = false) {
  const messages = [{ role: 'system', content: getSystemPrompt(remainingQuestions) }, ...conversation]
  if (forceFinal || remainingQuestions <= 0) {
    messages.push({ role: 'user', content: '지금은 질문하지 말고 위 템플릿에 맞춘 최종 추천만 출력하세요.' })
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
    }),
  })
  const data = await response.json()
  return { response, data }
}

async function sendMessage(userText) {
  if (!apiKey) {
    appendMessage('bot', '환경 변수 VITE_OPENAI_API_KEY가 설정되지 않았습니다.')
    return
  }

  appendMessage('user', userText)
  conversation.push({ role: 'user', content: userText })
  appendMessage('bot', '추천/분석 중...')

  try {
    let { response, data } = await requestCompletion(false)

    // remove the last "loading" bot message
    const last = chatWindow.lastElementChild
    if (last && last.classList.contains('bot')) {
      chatWindow.removeChild(last)
    }

    if (!response.ok) {
      const errMsg = data?.error?.message || '요청 실패'
      appendMessage('bot', `에러: ${errMsg}`)
      return
    }

    let text = data.choices?.[0]?.message?.content?.trim() || '응답이 비어 있습니다.'
    appendMessage('bot', text)
    conversation.push({ role: 'assistant', content: text })

    // If the assistant still asks questions after limit, force final output once
    if (remainingQuestions > 0 && looksLikeAQuestion(text)) {
      remainingQuestions -= 1
    }

    if (remainingQuestions <= 0 && looksLikeAQuestion(text)) {
      appendMessage('bot', '질문이 충분합니다. 최종 추천을 정리합니다...')
      const { response: r2, data: d2 } = await requestCompletion(true)
      if (!r2.ok) {
        const err2 = d2?.error?.message || '요청 실패'
        appendMessage('bot', `에러: ${err2}`)
        return
      }
      const finalText = d2.choices?.[0]?.message?.content?.trim() || '응답이 비어 있습니다.'
      appendMessage('bot', finalText)
      conversation.push({ role: 'assistant', content: finalText })
    }
  } catch (err) {
    // remove the last "loading" bot message if present
    const last = chatWindow.lastElementChild
    if (last && last.classList.contains('bot')) {
      chatWindow.removeChild(last)
    }
    appendMessage('bot', '네트워크 오류가 발생했습니다.')
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
  const text = input.value.trim()
  if (!text) return
  input.value = ''
  sendMessage(text)
})

// Basic styles to make chat usable without changing existing CSS too much
const style = document.createElement('style')
style.textContent = `
  .chatbot { max-width: 760px; margin: 40px auto; padding: 0 16px; }
  .chat-window { border: 1px solid #ddd; border-radius: 8px; padding: 12px; height: 420px; overflow-y: auto; background: #fafafa; }
  .chat-form { display: flex; gap: 8px; margin-top: 12px; }
  .chat-form input { flex: 1; padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px; }
  .chat-form button { padding: 10px 14px; border: none; border-radius: 6px; background: #646cff; color: #fff; cursor: pointer; }
  .msg { padding: 10px 12px; border-radius: 12px; margin: 8px 0; max-width: 85%; white-space: pre-wrap; color: #000; }
  .msg.user { background: #e7f0ff; align-self: flex-end; margin-left: auto; }
  .msg.bot { background: #fff; border: 1px solid #eee; }
  .hint { color: #6b7280; font-size: 12px; margin-top: 8px; }
`
document.head.appendChild(style)
