'use client';

import { useEffect, useState, useTransition } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { TEMPLATES } from '@/lib/templates';
import { getBackground } from '@/lib/backgrounds';
import { saveTemplateEventOrder } from '@/lib/actions/templateOrder';
import type { EventType } from '@/types/card';
import TemplateExpandList from './_TemplateExpandList';

type Tpl = (typeof TEMPLATES)[number];

interface Props {
  templates: Tpl[];
  eventType: EventType;
  /** DB에 저장된 초기 순서 (template_id[]) */
  initialOrder?: string[];
  configs?: Record<string, string[]>;
}

function applyOrder(tpls: Tpl[], order: string[]): Tpl[] {
  if (!order || order.length === 0) return tpls;
  const byId = new Map(tpls.map((t) => [t.id, t]));
  const ordered: Tpl[] = [];
  for (const id of order) {
    const t = byId.get(id);
    if (t) {
      ordered.push(t);
      byId.delete(id);
    }
  }
  // 미저장 항목은 기본순으로 뒤에
  for (const t of tpls) {
    if (byId.has(t.id)) ordered.push(t);
  }
  return ordered;
}

function DragRow({ tpl, isDragging, hasConfig }: { tpl: Tpl; isDragging?: boolean; hasConfig?: boolean }) {
  const bg = getBackground(tpl.bg_id);
  return (
    <div
      className={`flex items-center gap-3 p-3 bg-white rounded-xl border ${
        isDragging ? 'border-hydrangea-400 shadow-lg' : 'border-hydrangea-100'
      }`}
    >
      <GripVertical className="w-4 h-4 text-hydrangea-400 flex-shrink-0 cursor-grab touch-none" />
      <div
        className="w-10 h-14 rounded-md overflow-hidden border border-hydrangea-100 flex-shrink-0"
        style={!bg.imageUrl ? { background: bg.gradient } : undefined}
      >
        {bg.imageUrl && <img src={bg.imageUrl} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-hydrangea-700 truncate">{tpl.name}</span>
          {tpl.draft && !hasConfig && (
            <span className="text-[9px] px-1 py-0 rounded bg-amber-100 text-amber-700 font-semibold uppercase">
              Draft
            </span>
          )}
        </div>
        <code className="text-[10px] text-hydrangea-400">{tpl.id}</code>
      </div>
    </div>
  );
}

function SortableRow({ tpl, hasConfig }: { tpl: Tpl; hasConfig?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tpl.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DragRow tpl={tpl} isDragging={isDragging} hasConfig={hasConfig} />
    </div>
  );
}

export default function SortableTemplateList({ templates, eventType, initialOrder, configs }: Props) {
  const [items, setItems] = useState<Tpl[]>(() => applyOrder(templates, initialOrder || []));
  const [reorderMode, setReorderMode] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setItems(applyOrder(templates, initialOrder || []));
  }, [templates, initialOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((t) => t.id === active.id);
    const newIdx = items.findIndex((t) => t.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    startTransition(async () => {
      const res = await saveTemplateEventOrder(eventType, next.map((t) => t.id));
      if (!res.ok) {
        toast.error(res.error || '순서 저장 실패');
      } else {
        toast.success('순서 저장됨', { duration: 1200 });
      }
    });
  };

  if (!reorderMode) {
    return (
      <div>
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setReorderMode(true)}
            className="text-[11px] px-3 py-1.5 rounded-full bg-hydrangea-100 text-hydrangea-700 font-semibold active:scale-95 transition"
          >
            순서 변경
          </button>
        </div>
        <TemplateExpandList templates={items} eventType={eventType} configs={configs} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] text-hydrangea-500">
          드래그로 순서 변경 — 사용자에게 이 순서대로 노출됩니다 {pending && '· 저장 중...'}
        </span>
        <button
          type="button"
          onClick={() => setReorderMode(false)}
          className="text-[11px] px-3 py-1.5 rounded-full bg-hydrangea-500 text-white font-semibold active:scale-95 transition"
        >
          완료
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((tpl) => (
              <SortableRow
                key={tpl.id}
                tpl={tpl}
                hasConfig={!!(configs?.[tpl.id] && configs[tpl.id].length > 0)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
