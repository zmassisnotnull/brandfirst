export type CardSizeMm = {
  w: number;     // trim width (e.g. 90)
  h: number;     // trim height (e.g. 50)
  bleed: number; // e.g. 3
  safe: number;  // e.g. 4
};

export type ElementKind = "logo" | "text" | "qr" | "image";

export type CardElementMm = {
  id: string;
  kind: ElementKind;

  // mm coordinates are relative to PAGE top-left (including bleed area)
  x_mm: number;
  y_mm: number;
  w_mm: number;
  h_mm: number;

  rotate_deg?: number;
  locked?: boolean;

  // Useful for logo/qr
  lockAspectRatio?: boolean;

  // optional style payload (font, size, alignment etc.)
  style?: Record<string, unknown>;
};

export type CardLayoutDoc = {
  card_size_mm: CardSizeMm;
  elements: CardElementMm[];
};

export type GuideLine =
  | { axis: "x"; value_mm: number }
  | { axis: "y"; value_mm: number };

export type SnapSettings = {
  enabled: boolean;
  gridEnabled: boolean;
  gridMm: number;         // e.g. 1 or 2
  guidesEnabled: boolean;
  thresholdMm: number;    // e.g. 1.0
};
