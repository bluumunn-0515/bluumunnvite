/**
 * 🚗 Car Doctor AI - Logic Script
 */

const CONFIG = {
    // 1. OpenAI API 설정
    API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    MODEL: "gpt-4o-mini",
  
    // 2. Google Form 설정
    FORM_URL: "https://docs.google.com/forms/d/1lDx6j5e0ry8142qFv1Iu7g6dWfhVkhM9smlt-ROrPkM/formResponse",
    
    // 3. Google Form 필드 ID
    ENTRIES: {
        NAME: "entry.213299945",      // 학번/이름
        
        // [신규] 차량 정보 (ID를 구글폼에서 확인해서 채워주세요)
        CAR_TYPE: "entry.313847425",      
        CAR_BRAND: "entry.446070618",     
        CAR_MODEL: "entry.642616563",     
        CAR_ENGINE: "entry.525344175",    
        CAR_REMARK: "entry.614827607",    
  
        SYMPTOM: "entry.1921712289",   // 증상
        DIAGNOSIS: "entry.2030957689", // AI 진단 결과
        PLAN: "entry.907919031",      // 학생 정비 계획
        EVALUATION: "entry.833948221" // AI 최종 평가
    }
  };
  
  // [상태 관리]
  let sessionState = {
    name: "",
    carType: "",
    carBrand: "",
    carModel: "",
    carEngine: "",
    carRemark: "",
    symptom: "",
    aiDiagnosis: "",
    studentPlan: "",
    aiEvaluation: ""
  };
  
  // ============================================================
  // [기능 0-1] 학생 정보 저장 (Step 1 -> Step 2)
  // ============================================================
  function saveStudentInfo() {
      const name = document.getElementById('studentName').value.trim();
      
      if (!name) {
          showToast("학번과 이름을 입력해주세요!");
          return;
      }
  
      sessionState.name = name;
      
      // 다음 단계로 이동
      showSection('step2');
      setTimeout(() => {
          document.getElementById('step2').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
  }
  
  
  // ============================================================
  // [기능 0-2] 차량 제원 저장 (Step 2 -> Step 3)
  // ============================================================
  function saveVehicleSpecs() {
      const type = document.getElementById('carType').value;
      const brand = document.getElementById('carBrand').value.trim();
      const model = document.getElementById('carModel').value.trim();
      const engine = document.getElementById('carEngine').value.trim();
      const remark = document.getElementById('carRemark').value.trim();
  
      if (!brand || !model) {
          showToast("제조사와 모델명은 필수입니다!");
          return;
      }
  
      // 상태 저장
      sessionState.carType = type;
      sessionState.carBrand = brand;
      sessionState.carModel = model;
      sessionState.carEngine = engine;
      sessionState.carRemark = remark;
  
      // 다음 단계로 이동
      showSection('step3');
      setTimeout(() => {
          document.getElementById('step3').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
  }
  
  
  // ============================================================
  // [기능 1] 증상 분석 요청 (Step 3 -> Step 4)
  // ============================================================
  async function analyzeSymptom() {
    const symptomInput = document.getElementById('carSymptom');
    const symptom = symptomInput.value.trim();
  
    if (!symptom) {
        showToast("증상을 입력해주세요!");
        return;
    }
  
    sessionState.symptom = symptom;
  
    const loader = document.getElementById('loader1');
    const resultSection = document.getElementById('step4'); // 진단 리포트 섹션
    const outputDiv = document.getElementById('aiDiagnosisOutput');
  
    loader.style.display = 'block';
    
    // 차량 정보를 포함한 프롬프트
    const carInfoString = `
    [차량 정보]
    - 차종: ${sessionState.carType}
    - 모델: ${sessionState.carBrand} ${sessionState.carModel} (${sessionState.carEngine}cc)
    - 특이사항: ${sessionState.carRemark}
    `;
  
    if (!CONFIG.API_KEY) {
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
                            학생이 [차량 정보]와 [증상]을 말하면 다음 형식으로 답변하세요:
                            
                            1. 예상되는 기술적 원인 (2~3가지)
                            2. 점검해야 할 부품 및 위치
                            
                            [규칙]
                            - 구체적인 수리 순서는 생략하고, 원인과 점검 포인트 위주로 설명하세요.
                            - 고등학생 수준에 맞춰 설명하세요.`
                        },
                        { role: "user", content: `${carInfoString}\n[증상]: ${symptom}` }
                    ],
                    temperature: 0.7
                })
            });
  
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            
            const aiText = data.choices[0].message.content;
            sessionState.aiDiagnosis = aiText;
            outputDiv.innerText = aiText;
  
        } catch (error) {
            console.error("API Error:", error);
            showToast("오류 발생: " + error.message);
            outputDiv.innerText = "오류 발생";
        }
    }
  
    loader.style.display = 'none';
    showSection('step4'); // 진단 결과 표시
    showSection('step5'); // 정비 계획 입력창도 같이 표시
    
    setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
  
  
  // ============================================================
  // [기능 2] 학생 계획 평가 및 제출 (Step 5 -> Step 6)
  // ============================================================
  async function evaluateStudent() {
    const planInput = document.getElementById('studentActionPlan');
    const plan = planInput.value.trim();
  
    if (!plan) {
        showToast("정비 계획을 작성해주세요!");
        return;
    }
  
    sessionState.studentPlan = plan;
  
    const loader = document.getElementById('loader2');
    const resultDiv = document.getElementById('evaluationResult');
    const finalSection = document.getElementById('step6'); // 최종 평가 섹션
  
    loader.style.display = 'block';
  
    if (!CONFIG.API_KEY) {
        await runDemoMode('evaluation', resultDiv);
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
                            content: `당신은 정비 실습 평가관입니다. 학생의 정비 계획을 평가하세요.`
                        },
                        { 
                            role: "user", 
                            content: `
                            [차량]: ${sessionState.carBrand} ${sessionState.carModel} (${sessionState.carType})
                            [증상]: ${sessionState.symptom}
                            [AI 진단]: ${sessionState.aiDiagnosis}
                            [학생 계획]: ${plan}
                            
                            위 내용을 바탕으로 S/A/B/C/F 등급과 피드백을 주세요.` 
                        }
                    ],
                    temperature: 0.7
                })
            });
  
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
  
            const evaluationText = data.choices[0].message.content;
            sessionState.aiEvaluation = evaluationText;
            resultDiv.innerText = evaluationText;
  
        } catch (error) {
            console.error("Evaluation Error:", error);
            showToast("평가 중 오류 발생");
            resultDiv.innerText = "평가 실패";
            loader.style.display = 'none';
            return;
        }
    }
  
    // 구글 폼 전송
    submitToGoogleForm();
  
    loader.style.display = 'none';
    showSection('step6');
    
    setTimeout(() => {
        finalSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
  
  
  // ============================================================
  // [기능 3] Google Form 전송
  // ============================================================
  function submitToGoogleForm() {
    if (CONFIG.FORM_URL.includes("YOUR_FORM_ID")) return;
  
    const formData = new FormData();
    // 기본 정보
    formData.append(CONFIG.ENTRIES.NAME, sessionState.name);
    
    // 차량 정보
    formData.append(CONFIG.ENTRIES.CAR_TYPE, sessionState.carType);
    formData.append(CONFIG.ENTRIES.CAR_BRAND, sessionState.carBrand);
    formData.append(CONFIG.ENTRIES.CAR_MODEL, sessionState.carModel);
    formData.append(CONFIG.ENTRIES.CAR_ENGINE, sessionState.carEngine);
    formData.append(CONFIG.ENTRIES.CAR_REMARK, sessionState.carRemark);
  
    // 학습 데이터
    formData.append(CONFIG.ENTRIES.SYMPTOM, sessionState.symptom);
    formData.append(CONFIG.ENTRIES.DIAGNOSIS, sessionState.aiDiagnosis);
    formData.append(CONFIG.ENTRIES.PLAN, sessionState.studentPlan);
    formData.append(CONFIG.ENTRIES.EVALUATION, sessionState.aiEvaluation);
  
    fetch(CONFIG.FORM_URL, {
        method: "POST",
        mode: "no-cors", 
        body: formData
    }).then(() => {
        showToast("✅ 제출 완료!");
    }).catch((err) => {
        console.error(err);
        showToast("⚠️ 제출 실패");
    });
  }
  
  // UI 헬퍼 함수
  function showSection(id) {
    const el = document.getElementById(id);
    if(el) {
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('step-visible'), 50);
    }
  }
  
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if(toast) {
        toast.innerText = msg;
        toast.classList.remove('opacity-0');
        setTimeout(() => toast.classList.add('opacity-0'), 3000);
    }
  }
  
  // 데모 모드 생략
  async function runDemoMode(type, element) { /* ... */ }
  
  // [중요] 함수 내보내기
  window.saveStudentInfo = saveStudentInfo; // 신규 추가
  window.saveVehicleSpecs = saveVehicleSpecs;
  window.analyzeSymptom = analyzeSymptom;
  window.evaluateStudent = evaluateStudent;