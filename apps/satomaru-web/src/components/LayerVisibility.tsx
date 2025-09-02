import type { LayerKey } from "@/types/pin";
import { LAYER_LABELS } from "@/types/pin";
import { LAYER_THEME } from "@/theme/layers";

export type LayerVisibilityProps = {
  value: Record<LayerKey, boolean>;
  onChange: (v: Record<LayerKey, boolean>) => void;
};

const ALL_LAYERS: LayerKey[] = ["sumai", "kurashi", "manabi", "asobi", "other"];

export default function LayerVisibility({ value, onChange }: LayerVisibilityProps) {
  const toggle = (l: LayerKey) => onChange({ ...value, [l]: !value[l] });
  const setAll = (on: boolean) =>
    onChange({ sumai: on, kurashi: on, manabi: on, asobi: on, other: on });

  return (
    <div className="p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button className="px-2 py-1 border rounded text-xs" onClick={() => setAll(true)}>全選択</button>
        <button className="px-2 py-1 border rounded text-xs" onClick={() => setAll(false)}>全解除</button>
      </div>
      <div className="flex flex-col gap-2">
        {ALL_LAYERS.map((l) => {
          const theme = LAYER_THEME[l];
          return (
            <label key={l} className="flex items-center gap-2 rounded px-2 py-1 cursor-pointer select-none"
                   style={{ background: theme.pastel, color: theme.text }}>
              <input type="checkbox" checked={!!value[l]} onChange={() => toggle(l)} />
              <span className="inline-flex items-center gap-2 text-sm">
                <span style={{ width: 10, height: 10, borderRadius: 9999, background: theme.base, display: 'inline-block', border: `2px solid ${theme.border}` }} />
                {LAYER_LABELS[l]}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
