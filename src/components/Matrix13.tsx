import { ALL_169 } from '../engine/cards.ts';
export interface CellInfo { bg: string; text?: string; title?: string }
export function Matrix13({ getCell, onCell }: { getCell: (label: string) => CellInfo; onCell?: (label: string) => void }) {
  return (
    <div className="grid grid-cols-13 gap-[2px] w-full max-w-[560px]" style={{ gridTemplateColumns: 'repeat(13, minmax(0,1fr))' }}>
      {ALL_169.map((label) => {
        const c = getCell(label);
        return (
          <button key={label} title={c.title ?? label} onClick={() => onCell?.(label)}
            className="aspect-square flex items-center justify-center text-[9px] font-mono tabular rounded-[2px] border border-neutral-900 hover:border-electric transition-colors"
            style={{ background: c.bg, color: '#fff' }}>
            {c.text ?? label}
          </button>
        );
      })}
    </div>
  );
}
