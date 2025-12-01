/**
 * 🚗 Car Doctor AI - Logic Script
 * * 기능:
 * 1. OpenAI GPT API를 활용한 자동차 증상 진단 (원인 분석)
 * 2. 학생의 정비 계획에 대한 AI 평가 및 피드백
 * 3. 학습 결과(이름, 증상, 진단, 계획, 평가)를 Google Form으로 자동 제출
 */

// ============================================================
// [설정 영역] 사용자의 환경에 맞게 값을 수정하세요.
// ============================================================
const CONFIG = {
  // 1. OpenAI API 설정
  API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  MODEL: "gpt-4o-mini", // 비용 효율적인 모델 사용

  // 2. Google Form 설정 (전송용 URL)
  // 구글 폼의 '미리보기' 주소가 아니라, 'formResponse'로 끝나는 주소여야 합니다.
  FORM_URL: "https://docs.google.com/forms/d/1lDx6j5e0ry8142qFv1Iu7g6dWfhVkhM9smlt-ROrPkM/formResponse",
  
  // 3. Google Form 필드 ID (Entry ID)
  // 개발자 도구(F12)나 'Get pre-filled link' 기능을 통해 알아낸 ID를 매핑합니다.
  ENTRIES: {
      NAME: "entry.213299945",      // 학번/이름
      SYMPTOM: "entry.313847425",   // 증상
      DIAGNOSIS: "entry.2030957689", // AI 진단 결과
      PLAN: "entry.907919031",      // 학생 정비 계획
      EVALUATION: "entry.833948221" // AI 최종 평가
  }
};

// ============================================================
// [상태 관리] 현재 학습 세션의 데이터를 저장
// ============================================================
let sessionState = {
  name: "",
  symptom: "",
  aiDiagnosis: "", // 1단계 결과 저장
  studentPlan: "",
  aiEvaluation: "" // 2단계 결과 저장
};


// ============================================================
// [기능 1] 증상 분석 요청 (Step 1 -> Step 2)
// ============================================================
async function analyzeSymptom() {
  // 1. 입력값 가져오기
  const nameInput = document.getElementById('studentName');
  const symptomInput = document.getElementById('carSymptom');
  
  const name = nameInput.value.trim();
  const symptom = symptomInput.value.trim();

  // 2. 유효성 검사
  if (!name || !symptom) {
      showToast("학번/이름과 증상을 모두 입력해주세요!");
      return;
  }

  // 상태 저장
  sessionState.name = name;
  sessionState.symptom = symptom;

  // UI 업데이트 (로딩 시작)
  const loader = document.getElementById('loader1');
  const resultSection = document.getElementById('step2');
  const inputSection = document.getElementById('step3');
  const outputDiv = document.getElementById('aiDiagnosisOutput');

  loader.style.display = 'block';
  
  // 3. API 호출 (API 키가 없으면 데모 모드 실행)
  if (!CONFIG.API_KEY) {
      console.warn("API Key가 없습니다. 데모 모드로 실행됩니다.");
      await runDemoMode('diagnosis', outputDiv);
  } else {
      try {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${CONFIG.API_KEY}`
              },
              body: JSON.stringify({
                  model: CONFIG.MODEL,
                  messages: [
                      {
                          role: "system",
                          content: `당신은 자동차 정비 교사입니다. 
                          학생이 증상을 말하면 다음 형식으로 답변하세요:
                          1. 예상되는 기술적 원인 (2~3가지)
                          2. 점검해야 할 부품 및 위치
                          
                          [중요 규칙]
                          - 구체적인 수리 방법(교체 순서, 공구 사용법 등)은 절대 알려주지 마세요.
                          - 학생이 스스로 정비 지침서를 찾아보도록 유도하는 것이 목표입니다.
                          - 전문 용어를 사용하되, 고등학생 수준에 맞춰 설명하세요.`
                      },
                      { role: "user", content: symptom }
                  ],
                  temperature: 0.7
              })
          });

          const data = await response.json();
          
          if (data.error) throw new Error(data.error.message);
          
          const aiText = data.choices[0].message.content;
          sessionState.aiDiagnosis = aiText; // 결과 저장
          outputDiv.innerText = aiText;

      } catch (error) {
          console.error("API Error:", error);
          showToast("AI 분석 중 오류가 발생했습니다.");
          outputDiv.innerText = "오류 발생: " + error.message;
          // 실패 시 데모 데이터라도 보여주려면 아래 주석 해제
          // await runDemoMode('diagnosis', outputDiv);
      }
  }

  // 4. UI 업데이트 (결과 표시)
  loader.style.display = 'none';
  showSection('step2');
  showSection('step3');
  
  // 다음 단계를 위해 스크롤 이동
  setTimeout(() => {
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}


// ============================================================
// [기능 2] 학생 계획 평가 및 제출 (Step 3 -> Step 4)
// ============================================================
async function evaluateStudent() {
  // 1. 입력값 가져오기
  const planInput = document.getElementById('studentActionPlan');
  const plan = planInput.value.trim();

  if (!plan) {
      showToast("정비 계획을 작성해주세요!");
      return;
  }

  sessionState.studentPlan = plan;

  // UI 업데이트
  const loader = document.getElementById('loader2');
  const resultDiv = document.getElementById('evaluationResult');
  const finalSection = document.getElementById('step4');

  loader.style.display = 'block';

  // 2. API 호출 (평가)
  let evaluationText = "";

  if (!CONFIG.API_KEY) {
      await runDemoMode('evaluation', resultDiv);
      evaluationText = resultDiv.innerText; // 데모 텍스트 가져오기
  } else {
      try {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${CONFIG.API_KEY}`
              },
              body: JSON.stringify({
                  model: CONFIG.MODEL,
                  messages: [
                      {
                          role: "system",
                          content: `당신은 자동차 정비 실습 평가관입니다.
                          학생의 [정비 계획]이 앞서 진단된 [증상]과 [원인]을 해결하기에 적절한지 평가하세요.
                          
                          [출력 형식]
                          1. 평가 등급: (S/A/B/C/F 중 하나)
                          2. 잘한 점: (구체적으로)
                          3. 보완할 점: (안전 수칙, 누락된 점검 사항 등 피드백)
                          4. 총평: (한 줄 요약)`
                      },
                      { 
                          role: "user", 
                          content: `
                          [상황 정보]
                          - 증상: ${sessionState.symptom}
                          - AI 진단 원인: ${sessionState.aiDiagnosis}
                          
                          [학생 답안]
                          - 정비 계획: ${plan}
                          
                          위 내용을 바탕으로 평가해주세요.` 
                      }
                  ],
                  temperature: 0.7
              })
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error.message);

          evaluationText = data.choices[0].message.content;
          sessionState.aiEvaluation = evaluationText;
          resultDiv.innerText = evaluationText;

      } catch (error) {
          console.error("Evaluation Error:", error);
          showToast("평가 중 오류가 발생했습니다.");
          resultDiv.innerText = "평가 실패: " + error.message;
          loader.style.display = 'none';
          return;
      }
  }

  // 3. Google Form으로 데이터 전송 (백그라운드)
  // 평가가 완료된 후 전송해야 모든 데이터가 포함됨
  submitToGoogleForm();

  // 4. UI 업데이트
  loader.style.display = 'none';
  showSection('step4');
  
  setTimeout(() => {
      finalSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}


// ============================================================
// [기능 3] Google Form 전송 로직
// ============================================================
function submitToGoogleForm() {
  // 폼 URL이 설정되지 않았으면 건너뜀
  if (CONFIG.FORM_URL.includes("YOUR_FORM_ID")) {
      console.log("Google Form URL 미설정으로 전송 생략");
      return;
  }

  const formData = new FormData();
  formData.append(CONFIG.ENTRIES.NAME, sessionState.name);
  formData.append(CONFIG.ENTRIES.SYMPTOM, sessionState.symptom);
  formData.append(CONFIG.ENTRIES.DIAGNOSIS, sessionState.aiDiagnosis);
  formData.append(CONFIG.ENTRIES.PLAN, sessionState.studentPlan);
  formData.append(CONFIG.ENTRIES.EVALUATION, sessionState.aiEvaluation);

  // fetch using 'no-cors' mode
  fetch(CONFIG.FORM_URL, {
      method: "POST",
      mode: "no-cors", 
      body: formData
  })
  .then(() => {
      showToast("✅ 학습 결과가 선생님께 제출되었습니다!");
      console.log("Form submitted successfully");
  })
  .catch((err) => {
      console.error("Form submission failed:", err);
      showToast("⚠️ 결과 제출에 실패했습니다.");
  });
}


// ============================================================
// [유틸리티] UI 헬퍼 함수들
// ============================================================

// 섹션 표시 애니메이션
function showSection(id) {
  const el = document.getElementById(id);
  if(el) {
      el.classList.remove('hidden');
      // 브라우저 렌더링 타이밍을 위해 약간 지연
      setTimeout(() => {
          el.classList.add('step-visible');
      }, 50);
  }
}

// 토스트 메시지
function showToast(msg) {
  const toast = document.getElementById('toast');
  if(toast) {
      toast.innerText = msg;
      toast.classList.remove('opacity-0');
      setTimeout(() => {
          toast.classList.add('opacity-0');
      }, 3000);
  }
}

// 데모 모드 (API 키 없을 때 테스트용)
function runDemoMode(type, element) {
  return new Promise(resolve => {
      setTimeout(() => {
          if (type === 'diagnosis') {
              const demoText = `[데모 모드]\n1. 예상 원인: 브레이크 패드 마모 또는 디스크 변형\n2. 점검 위치: 캘리퍼 및 로터 상태 확인 필요.`;
              element.innerText = demoText;
              sessionState.aiDiagnosis = demoText;
          } else if (type === 'evaluation') {
              const demoEval = `[데모 평가]\n1. 평가 등급: B\n2. 잘한 점: 패드 교체 절차를 잘 알고 있음.\n3. 보완할 점: 안전 장구 착용 내용이 빠짐.\n4. 총평: 기본기가 탄탄함.`;
              element.innerText = demoEval;
              sessionState.aiEvaluation = demoEval;
          }
          resolve();
      }, 1500); // 1.5초 딜레이 흉내
  });
}
window.analyzeSymptom = analyzeSymptom;
window.evaluateStudent = evaluateStudent;