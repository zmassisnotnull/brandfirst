import { useEffect, useState } from "react";
import { ensureFontReady } from "./useFontReady";

/**
 * 폰트 로딩 상태를 관리하는 React Hook
 * 
 * 레이아웃 계산은 ready === true 이후에만 수행해야 함
 * 
 * @example
 * ```tsx
 * const { ready, error } = useFontLoading(['Montserrat', 'Noto Sans KR']);
 * 
 * useEffect(() => {
 *   if (!ready) return; // ✅ 폰트 준비 전에는 측정 금지
 *   runAutoLayoutAndMeasure(); // 텍스트 폭/줄바꿈/충돌검사
 * }, [ready, inputData]);
 * ```
 */
export function useFontLoading(fontFamilies: string[]) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedFonts, setLoadedFonts] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    setReady(false);
    setError(null);
    setLoadedFonts([]);

    const loadFonts = async () => {
      try {
        console.log(`🔄 Loading fonts: ${fontFamilies.join(', ')}`);
        
        // 중복 제거
        const uniqueFonts = [...new Set(fontFamilies)];
        
        // 순차적으로 로드 (각 폰트의 상태 추적)
        for (const fontFamily of uniqueFonts) {
          if (!alive) return;
          
          await ensureFontReady(fontFamily);
          
          if (alive) {
            setLoadedFonts(prev => [...prev, fontFamily]);
          }
        }
        
        if (alive) {
          setReady(true);
          console.log(`✅ All fonts loaded successfully: ${uniqueFonts.join(', ')}`);
        }
      } catch (e: any) {
        if (alive) {
          const errorMsg = e?.message ?? "Font loading failed";
          setError(errorMsg);
          console.error(`❌ Font loading error:`, errorMsg);
        }
      }
    };

    loadFonts();

    return () => {
      alive = false;
    };
  }, [fontFamilies.join("|")]); // fontFamilies 배열이 변경되면 재실행

  return { 
    ready, 
    error, 
    loadedFonts,
    progress: fontFamilies.length > 0 ? loadedFonts.length / fontFamilies.length : 0
  };
}

/**
 * 단일 폰트 로딩을 관리하는 간소화된 Hook
 */
export function useSingleFontLoading(fontFamily: string) {
  const result = useFontLoading([fontFamily]);
  return {
    ready: result.ready,
    error: result.error,
  };
}

/**
 * 폰트 로딩 상태를 조건부로 관리하는 Hook
 * (폰트가 비활성화된 경우 즉시 ready=true)
 */
export function useConditionalFontLoading(
  fontFamilies: string[],
  enabled: boolean
) {
  const { ready, error, loadedFonts, progress } = useFontLoading(fontFamilies);
  
  return {
    ready: enabled ? ready : true, // disabled면 바로 ready
    error: enabled ? error : null,
    loadedFonts,
    progress: enabled ? progress : 1,
  };
}
