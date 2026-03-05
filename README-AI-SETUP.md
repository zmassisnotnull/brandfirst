# AI 로고 생성 설정 가이드

MyBrands.ai는 AI 로고 생성을 위해 **무료(Hugging Face)**와 **유료(Replicate)** 두 가지 옵션을 제공합니다.

## 🆓 무료 버전 (기본값 - Hugging Face)

### 장점
- ✅ **완전 무료** (API 키만 있으면 됨)
- ✅ **빠른 생성** (1-4초/이미지)
- ✅ **괜찮은 품질** (FLUX.1-schnell 모델)

### 단점
- ⚠️ **Rate Limit** (분당 요청 제한)
- ⚠️ **첫 실행 시 모델 로딩** (20초 소요)
- ⚠️ **품질이 Pro 버전보다 낮음**

### 설정 방법

1. **Hugging Face 가입**
   - https://huggingface.co 접속
   - 무료 계정 생성

2. **API 토큰 발급**
   - https://huggingface.co/settings/tokens
   - "New token" 클릭
   - Name: `mybrands-ai`
   - Role: `read` 선택
   - 생성된 토큰 복사

3. **환경 변수 설정**
   ```
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
   ```

4. **완료!** AI 로고 생성 사용 가능

---

## 💎 유료 버전 (Replicate)

### 장점
- ✅ **최고 품질** (FLUX.1.1 Pro 모델)
- ✅ **안정적인 서비스**
- ✅ **Rate Limit 없음**

### 단점
- 💰 **비용 발생** (~$0.04/이미지)
- 💰 **4개 시안 생성 시 ~$0.16**

### 설정 방법

1. **Replicate 가입**
   - https://replicate.com 접속
   - 계정 생성 및 결제 정보 등록

2. **API 토큰 발급**
   - https://replicate.com/account/api-tokens
   - 토큰 복사

3. **환경 변수 설정**
   ```
   REPLICATE_API_KEY=r8_xxxxxxxxxxxxxxxxxxxxx
   LOGO_PROVIDER=replicate
   ```

4. **백엔드 코드 변경**
   `/supabase/functions/server/pdf-generator.tsx` 파일에서:
   ```typescript
   const useHuggingFace = false; // true → false로 변경
   ```

5. **완료!** 프리미엄 품질로 생성

---

## 🔄 전환 방법

### Hugging Face → Replicate로 전환
```typescript
// pdf-generator.tsx
const useHuggingFace = false; // 이 줄만 변경
```

### Replicate → Hugging Face로 전환
```typescript
// pdf-generator.tsx
const useHuggingFace = true; // 이 줄만 변경
```

---

## 📊 비교표

| 항목 | Hugging Face (무료) | Replicate (유료) |
|------|-------------------|-----------------|
| 비용 | 무료 | ~$0.04/이미지 |
| 속도 | 1-4초 (로딩 후) | 5-10초 |
| 품질 | 좋음 | 최고 |
| Rate Limit | 있음 | 없음 |
| 첫 실행 | 20초 로딩 | 바로 시작 |

---

## 🎯 추천 사용법

### 개발/테스트 단계
→ **Hugging Face** 사용 (무료)

### 프로덕션/실사용
→ **Replicate** 사용 (품질 보장)

### 하이브리드 전략
1. 먼저 Hugging Face로 무료 생성
2. 사용자가 만족하면 완료
3. 재생성 요청 시 Replicate 사용 (유료)

---

## ⚙️ 현재 설정 확인

서버 로그에서 확인:
```
Generating logo with Hugging Face FLUX.1-schnell... → 무료
Flux.1.1 Pro prediction started... → 유료
```

---

## 🆘 문제 해결

### "AI 모델이 로딩 중입니다" 오류
- Hugging Face 첫 실행 시 정상
- 20초 대기 후 자동 재시도

### "API key가 설정되지 않았습니다" 오류
- 환경 변수에 API 키 등록 필요
- Supabase 대시보드 → Edge Functions → Secrets

### Rate Limit 오류
- Hugging Face 무료 티어 제한
- 잠시 대기 후 재시도
- 또는 Replicate로 전환
