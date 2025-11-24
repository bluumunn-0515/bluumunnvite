import './style.css'
import { initChatbot, sendMessage } from './chatbot.js'


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
