// src/features/branding/card-editor/CardEditor.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { CardElementMm, CardLayoutDoc, GuideLine, SnapSettings } from "./cardEditor.types";
import { clamp, mmToPx, pxToMm, roundMm } from "./units";
import { snapMoveRectMm } from "./snap";

// shadcn/ui
import { Button } from "../../../app/components/ui/button";
import { Input } from "../../../app/components/ui/input";
import { Switch } from "../../../app/components/ui/switch";
import { Slider } from "../../../app/components/ui/slider";

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
type DragMode =
  | { type: "move"; elementId: string }
  | { type: "resize"; elementId: string; handle: ResizeHandle };

type DragState = {
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  startRect: { x: number; y: number; w: number; h: number };
  aspectRatio?: number;
  altKey: boolean; // alt => temporarily disable snapping
};

const MIN_W_MM = 6;
const MIN_H_MM = 6;

const DEFAULT_SNAP: SnapSettings = {
  enabled: true,
  gridEnabled: true,
  gridMm: 1,
  guidesEnabled: true,
  thresholdMm: 1,
};

export function CardEditor(props: {
  initialDoc?: CardLayoutDoc;
  onChange?: (doc: CardLayoutDoc) => void;
}) {
  const [doc, setDoc] = useState<CardLayoutDoc>(() => {
    return props.initialDoc ?? defaultCardDoc();
  });

  const [selectedId, setSelectedId] = useState<string | null>(doc.elements[0]?.id ?? null);
  const [zoom, setZoom] = useState(1.0);
  const [snap, setSnap] = useState<SnapSettings>(DEFAULT_SNAP);
  const [guides, setGuides] = useState<GuideLine[]>([]);

  const dragRef = useRef<DragState | null>(null);

  const card = doc.card_size_mm;
  const pageWmm = card.w + card.bleed * 2;
  const pageHmm = card.h + card.bleed * 2;

  const selected = doc.elements.find((e) => e.id === selectedId) ?? null;

  const othersForSnap = useMemo(() => {
    if (!selected) return doc.elements;
    return doc.elements.filter((e) => e.id !== selected.id);
  }, [doc.elements, selected]);

  function updateDoc(updater: (prev: CardLayoutDoc) => CardLayoutDoc) {
    setDoc((prev) => {
      const next = updater(prev);
      props.onChange?.(next);
      return next;
    });
  }

  function updateElement(elementId: string, patch: Partial<CardElementMm>) {
    updateDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((e) => (e.id === elementId ? { ...e, ...patch } : e)),
    }));
  }

  function deleteSelected() {
    if (!selectedId) return;
    updateDoc((prev) => ({
      ...prev,
      elements: prev.elements.filter((e) => e.id !== selectedId),
    }));
    setSelectedId(null);
  }

  // --- pointer handlers ---
  function beginMove(e: React.PointerEvent, elementId: string) {
    e.stopPropagation();
    const el = doc.elements.find((x) => x.id === elementId);
    if (!el || el.locked) return;

    setSelectedId(elementId);
    setGuides([]);

    dragRef.current = {
      mode: { type: "move", elementId },
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect: { x: el.x_mm, y: el.y_mm, w: el.w_mm, h: el.h_mm },
      altKey: e.altKey,
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  }

  function beginResize(e: React.PointerEvent, elementId: string, handle: ResizeHandle) {
    e.stopPropagation();
    const el = doc.elements.find((x) => x.id === elementId);
    if (!el || el.locked) return;

    setSelectedId(elementId);
    setGuides([]);

    dragRef.current = {
      mode: { type: "resize", elementId, handle },
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect: { x: el.x_mm, y: el.y_mm, w: el.w_mm, h: el.h_mm },
      aspectRatio: el.lockAspectRatio ? el.w_mm / el.h_mm : undefined,
      altKey: e.altKey,
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  }

  const onPointerMove = (ev: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dxPx = (ev.clientX - drag.startClientX) / zoom;
    const dyPx = (ev.clientY - drag.startClientY) / zoom;

    const dxMm = pxToMm(dxPx);
    const dyMm = pxToMm(dyPx);

    const altDisableSnap = drag.altKey || ev.altKey;

    if (drag.mode.type === "move") {
      const { elementId } = drag.mode;
      const start = drag.startRect;

      let nextX = start.x + dxMm;
      let nextY = start.y + dyMm;

      // clamp to page bounds
      nextX = clamp(nextX, 0, pageWmm - start.w);
      nextY = clamp(nextY, 0, pageHmm - start.h);

      // snap
      const { x, y, guides: g } = snapMoveRectMm({
        rect: { x: nextX, y: nextY, w: start.w, h: start.h },
        card,
        others: othersForSnap,
        snap: altDisableSnap ? { ...snap, enabled: false } : snap,
      });

      updateElement(elementId, { x_mm: roundMm(x, 0.1), y_mm: roundMm(y, 0.1) });
      setGuides(g);
      return;
    }

    // resize
    if (drag.mode.type === "resize") {
      const { elementId, handle } = drag.mode;
      const start = drag.startRect;

      let x = start.x;
      let y = start.y;
      let w = start.w;
      let h = start.h;

      // apply handle
      const apply = (handle: ResizeHandle) => {
        switch (handle) {
          case "se":
            w = start.w + dxMm; h = start.h + dyMm; break;
          case "e":
            w = start.w + dxMm; break;
          case "s":
            h = start.h + dyMm; break;
          case "nw":
            x = start.x + dxMm; y = start.y + dyMm;
            w = start.w - dxMm; h = start.h - dyMm; break;
          case "ne":
            y = start.y + dyMm;
            w = start.w + dxMm; h = start.h - dyMm; break;
          case "sw":
            x = start.x + dxMm;
            w = start.w - dxMm; h = start.h + dyMm; break;
          case "n":
            y = start.y + dyMm;
            h = start.h - dyMm; break;
          case "w":
            x = start.x + dxMm;
            w = start.w - dxMm; break;
        }
      };

      apply(handle);

      // aspect ratio lock (logo/qr 등)
      if (drag.aspectRatio) {
        const r = drag.aspectRatio;
        // which delta dominates?
        const dw = Math.abs(w - start.w);
        const dh = Math.abs(h - start.h);
        if (dw >= dh) {
          h = w / r;
        } else {
          w = h * r;
        }
      }

      // min size
      w = Math.max(w, MIN_W_MM);
      h = Math.max(h, MIN_H_MM);

      // keep within page
      x = clamp(x, 0, pageWmm - w);
      y = clamp(y, 0, pageHmm - h);

      // grid snapping on resize (간단 버전: 그리드만)
      if (snap.enabled && snap.gridEnabled && !altDisableSnap) {
        x = roundMm(x, snap.gridMm);
        y = roundMm(y, snap.gridMm);
        w = roundMm(w, snap.gridMm);
        h = roundMm(h, snap.gridMm);
      }

      updateElement(elementId, { x_mm: roundMm(x, 0.1), y_mm: roundMm(y, 0.1), w_mm: roundMm(w, 0.1), h_mm: roundMm(h, 0.1) });
      setGuides([]); // resize 가이드는 필요하면 확장 가능
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setGuides([]);
    window.removeEventListener("pointermove", onPointerMove);
  };

  // --- keyboard controls (move / delete) ---
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selected) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
        return;
      }

      const step = e.shiftKey ? 2 : 0.5;
      let dx = 0, dy = 0;
      if (e.key === "ArrowLeft") dx = -step;
      if (e.key === "ArrowRight") dx = step;
      if (e.key === "ArrowUp") dy = -step;
      if (e.key === "ArrowDown") dy = step;
      if (dx === 0 && dy === 0) return;

      e.preventDefault();
      const start = { x: selected.x_mm, y: selected.y_mm, w: selected.w_mm, h: selected.h_mm };
      let nx = clamp(start.x + dx, 0, pageWmm - start.w);
      let ny = clamp(start.y + dy, 0, pageHmm - start.h);

      const { x, y } = snapMoveRectMm({
        rect: { x: nx, y: ny, w: start.w, h: start.h },
        card,
        others: othersForSnap,
        snap: e.altKey ? { ...snap, enabled: false } : snap,
      });

      updateElement(selected.id, { x_mm: roundMm(x, 0.1), y_mm: roundMm(y, 0.1) });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, snap, pageWmm, pageHmm, othersForSnap]);

  // --- inspector input update helpers ---
  function setSelectedField(field: keyof CardElementMm, value: number) {
    if (!selected) return;
    if (selected.locked) return;

    if (field === "x_mm" || field === "y_mm") {
      const w = selected.w_mm;
      const h = selected.h_mm;
      const nx = field === "x_mm" ? clamp(value, 0, pageWmm - w) : selected.x_mm;
      const ny = field === "y_mm" ? clamp(value, 0, pageHmm - h) : selected.y_mm;
      updateElement(selected.id, { x_mm: roundMm(nx, 0.1), y_mm: roundMm(ny, 0.1) });
      return;
    }

    if (field === "w_mm" || field === "h_mm") {
      const nw = field === "w_mm" ? Math.max(value, MIN_W_MM) : selected.w_mm;
      const nh = field === "h_mm" ? Math.max(value, MIN_H_MM) : selected.h_mm;
      const nx = clamp(selected.x_mm, 0, pageWmm - nw);
      const ny = clamp(selected.y_mm, 0, pageHmm - nh);
      updateElement(selected.id, { x_mm: roundMm(nx, 0.1), y_mm: roundMm(ny, 0.1), w_mm: roundMm(nw, 0.1), h_mm: roundMm(nh, 0.1) });
      return;
    }
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4 p-4">
      {/* Left: Canvas */}
      <div className="flex-1 rounded-xl border bg-muted/20 p-4 overflow-auto">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={snap.enabled}
              onCheckedChange={(v) => setSnap((s) => ({ ...s, enabled: v }))}
            />
            <span className="text-sm">Snap</span>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={snap.gridEnabled}
              onCheckedChange={(v) => setSnap((s) => ({ ...s, gridEnabled: v }))}
              disabled={!snap.enabled}
            />
            <span className="text-sm">Grid</span>
            <Input
              className="w-20"
              type="number"
              step={1}
              value={snap.gridMm}
              onChange={(e) => setSnap((s) => ({ ...s, gridMm: Number(e.target.value || 1) }))}
              disabled={!snap.enabled || !snap.gridEnabled}
            />
            <span className="text-xs text-muted-foreground">mm</span>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={snap.guidesEnabled}
              onCheckedChange={(v) => setSnap((s) => ({ ...s, guidesEnabled: v }))}
              disabled={!snap.enabled}
            />
            <span className="text-sm">Guides</span>
          </div>

          <div className="ml-auto flex items-center gap-2 w-64">
            <span className="text-sm text-muted-foreground">Zoom</span>
            <Slider
              value={[zoom]}
              min={0.5}
              max={2.0}
              step={0.05}
              onValueChange={(v) => setZoom(v[0])}
            />
            <span className="w-12 text-right text-sm">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Scaled wrapper */}
        <div
          className="relative"
          style={{
            width: mmToPx(pageWmm) * zoom,
            height: mmToPx(pageHmm) * zoom,
          }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left shadow-sm"
            style={{
              width: mmToPx(pageWmm),
              height: mmToPx(pageHmm),
              transform: `scale(${zoom})`,
            }}
            onPointerDown={() => setSelectedId(null)}
          >
            <CanvasBackground card={card} />

            {/* Guides overlay */}
            <GuidesOverlay guides={guides} card={card} />

            {/* Elements */}
            {doc.elements.map((el) => (
              <ElementBox
                key={el.id}
                el={el}
                selected={el.id === selectedId}
                onSelect={() => setSelectedId(el.id)}
                onMoveStart={beginMove}
                onResizeStart={beginResize}
              />
            ))}
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <div>• 드래그: 이동 / 핸들 드래그: 리사이즈</div>
          <div>• 스냅 임시 해제: <b>Alt</b> 누른 채 이동</div>
          <div>• 키보드 이동: 방향키, <b>Shift</b>=2mm, 기본=0.5mm</div>
          <div>• 삭제: Delete/Backspace</div>
        </div>
      </div>

      {/* Right: Inspector */}
      <div className="w-[320px] rounded-xl border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Inspector</div>
          <Button variant="destructive" size="sm" onClick={deleteSelected} disabled={!selected}>
            Delete
          </Button>
        </div>

        {!selected ? (
          <div className="text-sm text-muted-foreground">요소를 선택하세요.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium">{selected.id}</div>
              <div className="text-xs text-muted-foreground">{selected.kind}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FieldMm label="x (mm)" value={selected.x_mm} onChange={(v) => setSelectedField("x_mm", v)} />
              <FieldMm label="y (mm)" value={selected.y_mm} onChange={(v) => setSelectedField("y_mm", v)} />
              <FieldMm label="w (mm)" value={selected.w_mm} onChange={(v) => setSelectedField("w_mm", v)} />
              <FieldMm label="h (mm)" value={selected.h_mm} onChange={(v) => setSelectedField("h_mm", v)} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Lock aspect ratio</div>
                <div className="text-xs text-muted-foreground">logo/qr에 유용</div>
              </div>
              <Switch
                checked={!!selected.lockAspectRatio}
                onCheckedChange={(v) => updateElement(selected.id, { lockAspectRatio: v })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Locked</div>
                <div className="text-xs text-muted-foreground">편집 금지</div>
              </div>
              <Switch
                checked={!!selected.locked}
                onCheckedChange={(v) => updateElement(selected.id, { locked: v })}
              />
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground mb-2">Raw JSON (elements)</div>
              <pre className="text-[10px] leading-4 overflow-auto max-h-48 bg-muted/40 p-2 rounded">
                {JSON.stringify(doc.elements, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldMm(props: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{props.label}</div>
      <Input
        type="number"
        step={0.1}
        value={Number.isFinite(props.value) ? props.value : 0}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </div>
  );
}

function CanvasBackground({ card }: { card: CardLayoutDoc["card_size_mm"] }) {
  const pageW = card.w + card.bleed * 2;
  const pageH = card.h + card.bleed * 2;

  // trim rect
  const trimX = card.bleed;
  const trimY = card.bleed;

  // safe rect
  const safeX = card.bleed + card.safe;
  const safeY = card.bleed + card.safe;
  const safeW = card.w - card.safe * 2;
  const safeH = card.h - card.safe * 2;

  return (
    <div
      className="absolute inset-0 bg-white"
      style={{ width: mmToPx(pageW), height: mmToPx(pageH) }}
    >
      {/* bleed 영역을 시각적으로 표시(연한 회색 테두리) */}
      <div className="absolute inset-0 border border-muted-foreground/20" />

      {/* trim 영역 */}
      <div
        className="absolute border-2 border-muted-foreground/30"
        style={{
          left: mmToPx(trimX),
          top: mmToPx(trimY),
          width: mmToPx(card.w),
          height: mmToPx(card.h),
        }}
      />

      {/* safe 영역 */}
      <div
        className="absolute border border-dashed border-orange-500/50"
        style={{
          left: mmToPx(safeX),
          top: mmToPx(safeY),
          width: mmToPx(safeW),
          height: mmToPx(safeH),
        }}
      />
    </div>
  );
}

function GuidesOverlay({ guides, card }: { guides: GuideLine[]; card: CardLayoutDoc["card_size_mm"] }) {
  const pageW = card.w + card.bleed * 2;
  const pageH = card.h + card.bleed * 2;

  return (
    <>
      {guides.map((g, idx) => {
        if (g.axis === "x") {
          return (
            <div
              key={idx}
              className="absolute top-0 w-px bg-blue-500/70"
              style={{
                left: mmToPx(g.value_mm),
                height: mmToPx(pageH),
              }}
            />
          );
        }
        return (
          <div
            key={idx}
            className="absolute left-0 h-px bg-blue-500/70"
            style={{
              top: mmToPx(g.value_mm),
              width: mmToPx(pageW),
            }}
          />
        );
      })}
    </>
  );
}

function ElementBox(props: {
  el: CardElementMm;
  selected: boolean;
  onSelect: () => void;
  onMoveStart: (e: React.PointerEvent, id: string) => void;
  onResizeStart: (e: React.PointerEvent, id: string, handle: ResizeHandle) => void;
}) {
  const { el, selected } = props;
  const left = mmToPx(el.x_mm);
  const top = mmToPx(el.y_mm);
  const width = mmToPx(el.w_mm);
  const height = mmToPx(el.h_mm);

  return (
    <div
      className={[
        "absolute",
        "cursor-move select-none",
        selected ? "outline outline-2 outline-blue-500" : "outline outline-1 outline-muted-foreground/20",
        el.locked ? "opacity-60" : ""
      ].join(" ")}
      style={{ left, top, width, height }}
      onPointerDown={(e) => {
        props.onSelect();
        props.onMoveStart(e, el.id);
      }}
    >
      {/* Content placeholder */}
      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
        {el.kind.toUpperCase()} : {el.id}
      </div>

      {selected && !el.locked && (
        <>
          <ResizeHandleBox pos="nw" onPointerDown={(e) => props.onResizeStart(e, el.id, "nw")} />
          <ResizeHandleBox pos="n" onPointerDown={(e) => props.onResizeStart(e, el.id, "n")} />
          <ResizeHandleBox pos="ne" onPointerDown={(e) => props.onResizeStart(e, el.id, "ne")} />
          <ResizeHandleBox pos="e" onPointerDown={(e) => props.onResizeStart(e, el.id, "e")} />
          <ResizeHandleBox pos="se" onPointerDown={(e) => props.onResizeStart(e, el.id, "se")} />
          <ResizeHandleBox pos="s" onPointerDown={(e) => props.onResizeStart(e, el.id, "s")} />
          <ResizeHandleBox pos="sw" onPointerDown={(e) => props.onResizeStart(e, el.id, "sw")} />
          <ResizeHandleBox pos="w" onPointerDown={(e) => props.onResizeStart(e, el.id, "w")} />
        </>
      )}
    </div>
  );
}

function ResizeHandleBox(props: {
  pos: ResizeHandle;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const base = "absolute w-2 h-2 bg-blue-500 border border-white rounded-sm";
  const cursor =
    props.pos === "nw" || props.pos === "se" ? "cursor-nwse-resize"
      : props.pos === "ne" || props.pos === "sw" ? "cursor-nesw-resize"
        : props.pos === "n" || props.pos === "s" ? "cursor-ns-resize"
          : "cursor-ew-resize";

  const style: React.CSSProperties = (() => {
    switch (props.pos) {
      case "nw": return { left: -4, top: -4 };
      case "n":  return { left: "50%", top: -4, transform: "translateX(-50%)" };
      case "ne": return { right: -4, top: -4 };
      case "e":  return { right: -4, top: "50%", transform: "translateY(-50%)" };
      case "se": return { right: -4, bottom: -4 };
      case "s":  return { left: "50%", bottom: -4, transform: "translateX(-50%)" };
      case "sw": return { left: -4, bottom: -4 };
      case "w":  return { left: -4, top: "50%", transform: "translateY(-50%)" };
    }
  })();

  return (
    <div
      className={`${base} ${cursor}`}
      style={style}
      onPointerDown={(e) => {
        e.stopPropagation();
        props.onPointerDown(e);
      }}
    />
  );
}

function defaultCardDoc(): CardLayoutDoc {
  // 좌표는 "페이지(bleed 포함) 기준"
  // bleed=3, safe=4이면, 안전선 시작은 7mm
  return {
    card_size_mm: { w: 90, h: 50, bleed: 3, safe: 4 },
    elements: [
      { id: "logo", kind: "logo", x_mm: 7, y_mm: 7, w_mm: 28, h_mm: 10, lockAspectRatio: true },
      { id: "name", kind: "text", x_mm: 7, y_mm: 22, w_mm: 76, h_mm: 6 },
      { id: "contact", kind: "text", x_mm: 7, y_mm: 32, w_mm: 76, h_mm: 15 },
      { id: "qr", kind: "qr", x_mm: 74, y_mm: 7, w_mm: 18, h_mm: 18, lockAspectRatio: true },
    ],
  };
}