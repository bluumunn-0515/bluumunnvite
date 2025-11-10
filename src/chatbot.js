// Google Form 제출 URL 및 필드 매핑
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/1b8bZGIoIQxXowWybfyNmDdc3ZIruS-7D65LdnkiFt7Y/formResponse';
const FORM_FIELDS = {
  name: 'entry.1595024416',
  country: 'entry.436238574',
  travelDate: 'entry.172834959_sentinel',
  travelType: 'entry.1461849951_sentinel',
  companions: 'entry.1803840397_sentinel',
  desires: 'entry.2139528715'
};

// 챗봇 상태 관리
class TravelChatbot {
  constructor() {
    this.conversationHistory = [];
    this.userData = {
      name: '',
      country: '',
      travelDate: '',
      travelType: '',
      companions: '',
      desires: ''
    };
    this.currentQuestion = null;
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!this.apiKey) {
      console.error('API Key가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요.');
    }
  }

  // 챗봇 초기화
  async init() {
    this.addMessage('bot', '안녕하세요! 유럽여행 계획을 도와드리는 챗봇입니다. 🗺️');
    await this.delay(1000);
    this.askQuestion('name', '먼저 이름을 알려주세요.');
  }

  // 질문하기
  askQuestion(field, question) {
    this.currentQuestion = field;
    this.addMessage('bot', question);
  }

  // 사용자 메시지 처리
  async handleUserMessage(message) {
    this.addMessage('user', message);
    
    if (!this.currentQuestion) {
      this.addMessage('bot', '질문에 답변해주세요.');
      return;
    }

    // 현재 질문에 대한 답변 저장
    this.userData[this.currentQuestion] = message;
    this.conversationHistory.push({
      role: 'user',
      content: message
    });

    // 다음 질문으로 진행
    await this.delay(500);
    await this.moveToNextQuestion();
  }

  // 다음 질문으로 이동
  async moveToNextQuestion() {
    if (!this.userData.name) {
      this.askQuestion('name', '이름을 알려주세요.');
    } else if (!this.userData.country) {
      this.askQuestion('country', `${this.userData.name}님, 유럽의 어느 나라로 여행가고 싶으신가요?`);
    } else if (!this.userData.travelDate) {
      this.askQuestion('travelDate', '언제 여행가면 좋을 것 같으신가요? (예: 2024년 6월, 여름 등)');
    } else if (!this.userData.travelType) {
      this.askQuestion('travelType', '여행 유형은 어떤 방법을 생각하고 계신가요? (예: 자유여행, 패키지여행, 배낭여행 등)');
    } else if (!this.userData.companions) {
      this.askQuestion('companions', '여행의 구성원은 어떻게 될 예정인가요? (예: 혼자, 친구와, 가족과 등)');
    } else if (!this.userData.desires) {
      this.askQuestion('desires', '유럽여행을 하면서 바라는 점이나 이루었으면 하는 점이 있나요?');
    } else {
      // 모든 질문 완료 - GPT를 통한 여행 계획 생성
      await this.generateTravelPlan();
    }
  }

  // GPT API를 통한 여행 계획 생성
  async generateTravelPlan() {
    this.addMessage('bot', '정보를 바탕으로 여행 계획을 만들어드리겠습니다. 잠시만 기다려주세요...');
    
    const prompt = `다음은 유럽여행 계획을 세우려는 사용자의 정보입니다:
- 이름: ${this.userData.name}
- 여행 국가: ${this.userData.country}
- 여행 시기: ${this.userData.travelDate}
- 여행 유형: ${this.userData.travelType}
- 구성원: ${this.userData.companions}
- 바라는 점: ${this.userData.desires}

이 정보를 바탕으로:
1. 추천 여행 코스를 구체적으로 제안해주세요 (3-5일 기준)
2. 예상 여행 경비를 항목별로 자세히 알려주세요
3. 추가 팁이나 주의사항을 제공해주세요

친절하고 구체적으로 답변해주세요.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '당신은 유럽여행 전문 상담사입니다. 친절하고 구체적인 여행 계획과 예산 정보를 제공합니다.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const travelPlan = data.choices[0].message.content;
      
      this.addMessage('bot', travelPlan);
      
      // Google Form에 데이터 제출
      await this.submitToGoogleForm();
      
      this.addMessage('bot', '설문조사가 완료되었습니다. 즐거운 여행되세요! ✈️');
      
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      this.addMessage('bot', '죄송합니다. 여행 계획을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }

  // Google Form에 데이터 제출
  submitToGoogleForm() {
    // Google Form은 sentinel 필드에서 "_sentinel"을 제거해야 합니다
    const formFields = {
      name: FORM_FIELDS.name,
      country: FORM_FIELDS.country,
      travelDate: FORM_FIELDS.travelDate.replace('_sentinel', ''),
      travelType: FORM_FIELDS.travelType.replace('_sentinel', ''),
      companions: FORM_FIELDS.companions.replace('_sentinel', ''),
      desires: FORM_FIELDS.desires
    };

    // Hidden iframe을 사용하여 Google Form 제출 (CORS 우회)
    const iframe = document.createElement('iframe');
    iframe.name = 'hidden_iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Form 생성 및 제출
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = GOOGLE_FORM_URL;
    form.target = 'hidden_iframe';
    form.style.display = 'none';

    // 각 필드에 대한 input 요소 생성
    Object.keys(formFields).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = formFields[key];
      input.value = this.userData[key] || '';
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

    // 정리
    setTimeout(() => {
      document.body.removeChild(form);
      document.body.removeChild(iframe);
    }, 2000);

    console.log('Google Form 제출 완료');
  }

  // 메시지 추가
  addMessage(sender, text) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = text;
    
    messageDiv.appendChild(messageContent);
    messagesContainer.appendChild(messageDiv);
    
    // 스크롤을 맨 아래로
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // 딜레이 함수
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 챗봇 인스턴스 생성 및 초기화
let chatbot;

export function initChatbot() {
  chatbot = new TravelChatbot();
  chatbot.init();
}

export function sendMessage(message) {
  if (chatbot) {
    chatbot.handleUserMessage(message);
  }
}

