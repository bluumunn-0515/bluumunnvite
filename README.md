# 유럽여행 계획 챗봇

Vite + Netlify 환경에서 동작하는 유럽여행 계획 챗봇입니다.

## 기능

- 사용자와 대화를 통해 여행 정보 수집
- GPT API를 사용한 맞춤형 여행 계획 및 예산 제안
- Google Form으로 설문 데이터 자동 제출

## 설정 방법

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 OpenAI API 키를 설정하세요:

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

**중요**: Vite에서 환경 변수를 클라이언트 코드에서 사용하려면 `VITE_` 접두사를 반드시 사용해야 합니다.

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

### 5. Netlify 배포

1. Netlify에 프로젝트를 연결합니다.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. 환경 변수 설정:
   - Netlify 대시보드 > Site settings > Environment variables
   - `VITE_OPENAI_API_KEY` 추가

## Google Form 필드 매핑

- 이름: `entry.1595024416`
- 여행 국가: `entry.436238574`
- 여행 시기: `entry.172834959_sentinel`
- 여행 유형: `entry.1461849951_sentinel`
- 구성원: `entry.1803840397_sentinel`
- 바라는 점: `entry.2139528715`

## 보안 주의사항

⚠️ **중요**: 현재 구현은 클라이언트 사이드에서 OpenAI API 키를 사용합니다. 이는 API 키가 브라우저에 노출될 수 있음을 의미합니다.

프로덕션 환경에서는 다음 방법을 고려하세요:
- Netlify Functions 사용
- 백엔드 서버 구축
- API 키를 서버 사이드에서만 사용

## 라이선스

MIT

