# 🚗 Car Doctor AI (자동차 정비 AI 튜터)

**Car Doctor AI**는 자동차 정비 실습을 돕기 위해 개발된 웹 애플리케이션입니다.
단순히 정답을 알려주는 챗봇이 아니라, 학생이 스스로 원인을 파악하고 정비 계획을 세우면 AI가 이를 평가해주는 **탐구 학습(Inquiry-based Learning)** 도구입니다.

---

## ✨ 주요 기능

1.  **증상 접수 (Step 1)**
    * 학생이 차량의 이상 증상과 학번/이름을 입력합니다.
2.  **AI 원인 분석 (Step 2)**
    * OpenAI GPT가 증상을 분석하여 '예상 원인'과 '점검 부품'을 제시합니다.
    * *핵심:* 구체적인 수리 방법은 알려주지 않아 학생의 탐구를 유도합니다.
3.  **정비 계획 수립 (Step 3)**
    * 학생이 AI의 분석을 토대로 스스로 정비 계획(조치 사항)을 작성하여 제출합니다.
4.  **AI 자동 평가 및 피드백 (Step 4)**
    * AI가 학생의 정비 계획이 적절한지 평가(S~F 등급)하고, 보완할 점을 피드백합니다.
5.  **Google Forms 자동 제출**
    * 학습이 끝나면 모든 데이터(증상, 진단, 계획, 평가)가 선생님의 Google Form으로 자동 전송됩니다.

---

## 🛠 기술 스택

* **Frontend:** HTML5, Tailwind CSS
* **Logic:** Vanilla JavaScript (ES6+)
* **AI:** OpenAI API (GPT-4o-mini)
* **Data Integration:** Google Forms
* **Build Tool:** Vite

---

## 🚀 시작하기 (Quick Start)

이 프로젝트는 로컬 환경에서 바로 실행할 수 있습니다.

### 1. 설치
프로젝트 폴더에서 패키지를 설치합니다.
```bash
npm install