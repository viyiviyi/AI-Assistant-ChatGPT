import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useState } from "react";

export function DragList<T>({
  data,
  itemDom,
  onChange,
}: {
  data: T[];
  itemDom: (item: T) => React.ReactElement;
  onChange: (data: T[]) => void;
}) {
  const [dataSource, setDataSource] = useState<Array<T & { key: number }>>(
    data.map((v, idx) => ({ ...v, key: idx }))
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setDataSource((previous) => {
        const activeIndex = previous.findIndex((i) => i.key === active.id);
        const overIndex = previous.findIndex((i) => i.key === over?.id);
        let arr = arrayMove(previous, activeIndex, overIndex);
        data
        onChange(arr.map((v) => ({ ...v, key: undefined })));
        return arr;
      });
    }
  };
  return (
    <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext
        // rowKey array
        items={dataSource.map((i) => i.key)}
        strategy={verticalListSortingStrategy}
      >
        {dataSource.map(itemDom)}
      </SortableContext>
    </DndContext>
  );
}
