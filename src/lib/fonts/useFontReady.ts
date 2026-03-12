/**
 * 폰트 로드 완료를 보장하는 핵심 유틸리티
 * 
 * 레이아웃 계산(측정/줄바꿈/충돌검사) 전에 반드시 호출해야 함
 */

/**
 * 특정 폰트가 완전히 로드될 때까지 대기
 * 
 * @param fontFamily - 폰트 이름 (예: "Montserrat", "Noto Sans KR")
 * @param sample - 측정용 샘플 텍스트 (다양한 글리프 포함 권장)
 * @throws Error - 폰트 로드 실패 시
 */
export async function ensureFontReady(
  fontFamily: string,
  sample = "HamburgefontsIV123가나다ABCabc"
): Promise<void> {
  try {
    // 1) 동적 폰트 주입 (Google Fonts)
    if (typeof window !== 'undefined') {
      const familyStr = fontFamily.trim().replace(/\s+/g, '+');
      const fontId = `google-font-${familyStr.toLowerCase()}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        // 100~900까지 주요 웨이트 요청
        link.href = `https://fonts.googleapis.com/css2?family=${familyStr}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
        
        // 브라우저가 CSS를 다운로드하고 파싱할 시간을 약간 부여
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // 2) load 시도: 브라우저에게 해당 폰트를 실제로 필요하다고 알려줌
    // size는 실제 사용 사이즈와 비슷하게 (예: 16px)
    await document.fonts.load(`16px "${fontFamily}"`, sample);

    // 2) fonts.ready: 현재 대기 중인 모든 폰트 로드가 끝날 때까지 대기
    await document.fonts.ready;

    // 3) 추가 안전장치: 실제로 로드되었는지 체크
    if (!document.fonts.check(`16px "${fontFamily}"`, sample)) {
      console.warn(`Font check failed for: ${fontFamily}`);
      throw new Error(`Font not ready: ${fontFamily}`);
    }

    console.log(`✅ Font ready: ${fontFamily}`);
  } catch (error) {
    console.error(`❌ Font loading failed: ${fontFamily}`, error);
    throw error;
  }
}

/**
 * 여러 폰트를 동시에 로드 (병렬 처리)
 * 
 * @param fontFamilies - 폰트 이름 배열
 * @param sample - 측정용 샘플 텍스트
 */
export async function ensureMultipleFontsReady(
  fontFamilies: string[],
  sample = "HamburgefontsIV123가나다ABCabc"
): Promise<void> {
  const uniqueFonts = [...new Set(fontFamilies)];
  
  await Promise.all(
    uniqueFonts.map(font => ensureFontReady(font, sample))
  );
  
  console.log(`✅ All fonts ready: ${uniqueFonts.join(', ')}`);
}

/**
 * 폰트 로드 타임아웃 (네트워크 실패 대응)
 * 
 * @param fontFamily - 폰트 이름
 * @param timeoutMs - 타임아웃 (ms)
 */
export async function ensureFontReadyWithTimeout(
  fontFamily: string,
  timeoutMs = 10000
): Promise<boolean> {
  try {
    await Promise.race([
      ensureFontReady(fontFamily),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Font load timeout')), timeoutMs)
      ),
    ]);
    return true;
  } catch (error) {
    console.warn(`⚠️ Font load timeout or failed: ${fontFamily}`, error);
    return false;
  }
}

/**
 * 폰트가 실제로 사용 가능한지 체크 (동기)
 * 
 * @param fontFamily - 폰트 이름
 * @param sample - 측정용 샘플 텍스트
 */
export function isFontReady(
  fontFamily: string,
  sample = "HamburgefontsIV123가나다ABCabc"
): boolean {
  return document.fonts.check(`16px "${fontFamily}"`, sample);
}
