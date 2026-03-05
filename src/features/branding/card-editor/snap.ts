import type { CardElementMm, CardSizeMm, GuideLine, SnapSettings } from "./cardEditor.types";
import { roundMm } from "./units";

type RectMm = { x: number; y: number; w: number; h: number };

function buildAxisTargetsMm(
  axis: "x" | "y",
  card: CardSizeMm,
  others: CardElementMm[]
) {
  const pageW = card.w + card.bleed * 2;
  const pageH = card.h + card.bleed * 2;

  // Trim rect starts at (bleed, bleed)
  const trimStart = card.bleed;
  const trimEndX = card.bleed + card.w;
  const trimEndY = card.bleed + card.h;

  // Safe rect is inset inside trim
  const safeStart = card.bleed + card.safe;
  const safeEndX = card.bleed + card.w - card.safe;
  const safeEndY = card.bleed + card.h - card.safe;

  const base = axis === "x"
    ? [0, pageW, trimStart, trimEndX, safeStart, safeEndX]
    : [0, pageH, trimStart, trimEndY, safeStart, safeEndY];

  const elementTargets: number[] = [];
  for (const e of others) {
    if (axis === "x") {
      elementTargets.push(e.x_mm, e.x_mm + e.w_mm, e.x_mm + e.w_mm / 2);
    } else {
      elementTargets.push(e.y_mm, e.y_mm + e.h_mm, e.y_mm + e.h_mm / 2);
    }
  }

  return [...base, ...elementTargets];
}

function pickBestSnap(current: number, targets: number[], threshold: number) {
  let best: { value: number; dist: number } | null = null;
  for (const t of targets) {
    const dist = Math.abs(current - t);
    if (dist <= threshold && (!best || dist < best.dist)) {
      best = { value: t, dist };
    }
  }
  return best;
}

/**
 * Snap move result for a rect (x,y,w,h)
 * - tries to snap x based on left/right/center to targets
 * - tries to snap y based on top/bottom/center to targets
 */
export function snapMoveRectMm(args: {
  rect: RectMm;
  card: CardSizeMm;
  others: CardElementMm[];
  snap: SnapSettings;
  applyGridAfterGuides?: boolean;
}) {
  const { rect, card, others, snap } = args;
  const guides: GuideLine[] = [];
  let x = rect.x;
  let y = rect.y;

  if (!snap.enabled) {
    return { x, y, guides };
  }

  const targetsX = buildAxisTargetsMm("x", card, others);
  const targetsY = buildAxisTargetsMm("y", card, others);

  // try guide snap on X using left/right/center
  if (snap.guidesEnabled) {
    const left = x;
    const right = x + rect.w;
    const center = x + rect.w / 2;

    const bestLeft = pickBestSnap(left, targetsX, snap.thresholdMm);
    const bestRight = pickBestSnap(right, targetsX, snap.thresholdMm);
    const bestCenter = pickBestSnap(center, targetsX, snap.thresholdMm);

    // choose smallest dist among candidates
    const best = [bestLeft, bestRight, bestCenter].filter(Boolean) as {value:number; dist:number}[];
    if (best.length) {
      best.sort((a, b) => a.dist - b.dist);
      const chosen = best[0];

      // determine which anchor snapped
      if (bestLeft && chosen.value === bestLeft.value) {
        x = chosen.value;
      } else if (bestRight && chosen.value === bestRight.value) {
        x = chosen.value - rect.w;
      } else {
        x = chosen.value - rect.w / 2;
      }
      guides.push({ axis: "x", value_mm: chosen.value });
    }
  }

  // try guide snap on Y using top/bottom/center
  if (snap.guidesEnabled) {
    const top = y;
    const bottom = y + rect.h;
    const center = y + rect.h / 2;

    const bestTop = pickBestSnap(top, targetsY, snap.thresholdMm);
    const bestBottom = pickBestSnap(bottom, targetsY, snap.thresholdMm);
    const bestCenter = pickBestSnap(center, targetsY, snap.thresholdMm);

    const best = [bestTop, bestBottom, bestCenter].filter(Boolean) as {value:number; dist:number}[];
    if (best.length) {
      best.sort((a, b) => a.dist - b.dist);
      const chosen = best[0];

      if (bestTop && chosen.value === bestTop.value) {
        y = chosen.value;
      } else if (bestBottom && chosen.value === bestBottom.value) {
        y = chosen.value - rect.h;
      } else {
        y = chosen.value - rect.h / 2;
      }
      guides.push({ axis: "y", value_mm: chosen.value });
    }
  }

  // grid snap (if not snapped OR even if snapped – 취향 문제)
  if (snap.gridEnabled) {
    // 기본은 "가이드 스냅 우선, 그 다음 그리드"
    x = roundMm(x, snap.gridMm);
    y = roundMm(y, snap.gridMm);
  }

  return { x, y, guides };
}
