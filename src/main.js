import './style.css'
import { initChatbot, sendMessage } from './chatbot.js'

document.querySelector('#app').innerHTML = `
  <div class="chatbot-container">
    <div class="chatbot-header">
      <h1>🗺️ 유럽여행 계획 챗봇</h1>
      <p>여행 계획을 세우고 예산을 알아보세요!</p>
    </div>
    <div class="chatbot-messages" id="messages"></div>
    <div class="chatbot-input-container">
      <input 
        type="text" 
        id="userInput" 
        placeholder="메시지를 입력하세요..." 
        autocomplete="off"
      />
      <button id="sendButton">전송</button>
    </div>
  </div>
`

// 챗봇 초기화
initChatbot();

// 입력 필드 및 전송 버튼 이벤트 리스너
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

function handleSend() {
  const message = userInput.value.trim();
  if (message) {
    sendMessage(message);
    userInput.value = '';
  }
}

sendButton.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleSend();
  }
});

// 포커스 설정
userInput.focus();
