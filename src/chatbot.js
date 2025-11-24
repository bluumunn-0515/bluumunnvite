// Google Form 제출 URL 및 필드 매핑
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/1b8bZGIoIQxXowWybfyNmDdc3ZIruS-7D65LdnkiFt7Y/formResponse';
const FORM_FIELDS = {
  studentName: 'entry.1595024416',
  vehicleInfo: 'entry.436238574',
  symptomDescription: 'entry.172834959',
  diagnosticReport: 'entry.1461849951',
  researchNotes: 'entry.1803840397',
  evaluation: 'entry.2139528715'
};

// 챗봇 상태 관리
class TravelChatbot {
  constructor() {
    this.conversationHistory = [];
    this.userData = {
      studentName: '',
      vehicleInfo: '',
      symptomDescription: '',
      researchNotes: ''
    };
    this.currentQuestion = null;
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.diagnosticReport = '';
    this.finalEvaluation = '';
    
    if (!this.apiKey) {
      console.error('API Key가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요.');
    }
  }

  // 챗봇 초기화
  async init() {
    this.addMessage('bot', '안녕하세요! 자동차 이상 증상 진단 실습을 도와드릴 AI 조교입니다. 🔧');
    await this.delay(1000);
    this.askQuestion('studentName', '먼저 실습에 참여하는 학생의 이름 또는 학번을 입력해주세요.');
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
    const questionKey = this.currentQuestion;
    this.userData[questionKey] = message;
    this.conversationHistory.push({
      role: 'user',
      content: message
    });

    await this.delay(500);

    if (questionKey === 'symptomDescription') {
      await this.generateDiagnosticReport();
      return;
    }

    if (questionKey === 'researchNotes') {
      await this.evaluateStudentActions();
      return;
    }

    await this.moveToNextQuestion();
  }

  // 다음 질문으로 이동
  async moveToNextQuestion() {
    if (!this.userData.studentName) {
      this.askQuestion('studentName', '먼저 실습에 참여하는 학생의 이름 또는 학번을 입력해주세요.');
    } else if (!this.userData.vehicleInfo) {
      this.askQuestion('vehicleInfo', `${this.userData.studentName} 님, 차량 모델과 연식을 알려주세요.`);
    } else if (!this.userData.symptomDescription) {
      this.askQuestion('symptomDescription', '차량에서 감지된 이상 증상과 경고등, 주행 상황 등을 가능한 한 구체적으로 작성해주세요.');
    }
  }

  // AI 진단 리포트 생성
  async generateDiagnosticReport() {
    this.addMessage('bot', '입력된 증상을 분석하여 AI 진단 리포트를 작성 중입니다. 잠시만 기다려주세요...');
    
    const prompt = `자동차 실습 학생의 입력 정보를 바탕으로 고장 진단 리포트를 작성하세요.
학생 이름: ${this.userData.studentName}
차량 정보: ${this.userData.vehicleInfo}
학생이 보고한 이상 증상: ${this.userData.symptomDescription}

아래 형식을 지켜주세요.
<AI 진단 리포트>
1) 의심되는 고장 원인 (최대 3개, 우선순위 포함)
2) 권장 점검 항목 (센서, 배선, 기계 부품 등)
3) 필요한 측정 장비/예비 부품
4) 추가 관찰/데이터 수집 가이드

전문적인 정비 용어를 사용하되 학생이 이해할 수 있도록 간결하게 작성하세요.`;

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
              content: '당신은 자동차 정비 교육을 돕는 전문 AI 진단사입니다. 입력된 증상을 바탕으로 체계적인 고장 진단 리포트를 작성하세요.'
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
      const diagnosticReport = data.choices[0].message.content;
      this.diagnosticReport = diagnosticReport;
      this.addMessage('bot', diagnosticReport);
      await this.delay(1000);
      this.askQuestion(
        'researchNotes',
        'AI 진단 리포트를 참고하여 필요한 정비 및 조치사항을 조사한 뒤, 실행 계획 또는 예상 절차를 작성해 제출해주세요.'
      );
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      this.addMessage('bot', '죄송합니다. 진단 리포트를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }

  // 학생 조사 내용을 평가
  async evaluateStudentActions() {
    this.addMessage('bot', '제출된 정비 및 조치사항을 분석하여 학습 이해도를 평가하는 중입니다...');

    const prompt = `다음은 자동차 실습 수업 중 AI가 생성한 진단 리포트와 학생이 조사한 정비/조치 보고서입니다.

<AI 진단 리포트>
${this.diagnosticReport}

<학생 조사 보고서>
${this.userData.researchNotes}

학생 보고서가 제안된 고장 원인과 정비 조치에 얼마나 부합하는지 0~100점으로 평가하고,
1) 강점
2) 보완할 점
3) 이번 수업 학습 목표 달성도
를 순서대로 작성하세요. 마지막에 "최종 점수: OO점" 형태로 점수를 명시하세요.`;

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
              content: '당신은 자동차 정비 실습을 지도하는 강사입니다. 학생 보고서를 평가하고 구체적인 피드백과 점수를 제공합니다.'
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
      const evaluation = data.choices[0].message.content;
      this.finalEvaluation = evaluation;
      this.addMessage('bot', evaluation);

      await this.submitToGoogleForm();
      this.addMessage('bot', '모든 단계가 완료되었습니다. 수고하셨습니다! ✅');
      this.currentQuestion = null;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      this.addMessage('bot', '죄송합니다. 평가를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }

  // Google Form에 데이터 제출
  submitToGoogleForm() {
    // Google Form은 sentinel 필드에서 "_sentinel"을 제거해야 합니다
    const payload = {
      ...this.userData,
      diagnosticReport: this.diagnosticReport,
      evaluation: this.finalEvaluation
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
    Object.keys(FORM_FIELDS).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = FORM_FIELDS[key];
      input.value = payload[key] || '';
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

