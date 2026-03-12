const normalizeFamily = (family: string): string => family.trim().replace(/\s+/g, ' ');

const buildGoogleFontsCssUrl = (family: string, weights: number[]): string => {
  const encodedFamily = normalizeFamily(family).replace(/ /g, '+');
  const uniqueWeights = Array.from(new Set(weights)).sort((a, b) => a - b).join(';');
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${uniqueWeights}&display=swap`;
};

const extractWoff2Url = (cssText: string): string | null => {
  const matches = Array.from(cssText.matchAll(/url\((https:[^)]+\.woff2)\)/g));
  if (matches.length === 0) return null;
  return matches[matches.length - 1][1];
};

export async function resolveGoogleFontWoff2Url(
  family: string,
  weights: number[] = [400, 700]
): Promise<string | undefined> {
  const cssUrl = buildGoogleFontsCssUrl(family, weights);
  const response = await fetch(cssUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const cssText = await response.text();
  return extractWoff2Url(cssText) ?? undefined;
}
