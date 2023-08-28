import { MenuOutlined } from "@ant-design/icons";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useEffect, useState } from "react";
import { SkipExport } from "./SkipExport";

export function DragList<T>({
  data,
  itemDom,
  onChange,
  style,
  centenDrag = false,
}: {
  data: Array<T & { key: string }>;
  itemDom: (item: T, index: number) => React.ReactElement | undefined;
  onChange: (data: T[]) => void;
  style?: React.CSSProperties;
  centenDrag?: boolean;
}) {
  const [dataSource, setDataSource] =
    useState<Array<T & { key: string }>>(data);
  useEffect(() => {
    setDataSource(data);
  }, [data]);
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setDataSource((previous) => {
        const activeIndex = previous.findIndex((i) => i.key === active.id);
        const overIndex = previous.findIndex((i) => i.key === over?.id);
        let arr = arrayMove(previous, activeIndex, overIndex);
        onChange(arr);
        return arr;
      });
    }
  };

  return (
    <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext
        items={dataSource.map((i) => i.key)}
        strategy={verticalListSortingStrategy}
      >
        {dataSource.map((v, idx) => {
          let dom = itemDom(v, idx);
          if (!dom) return undefined;
          return (
            <Row style={style} key={v.key} data-row-key={v.key}>
              {dom}
            </Row>
          );
        })}
      </SortableContext>
    </DndContext>
  );
}
interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  "data-row-key": string;
  centenDrag?: boolean;
}
function Row({ children, ...props }: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 9999 } : {}),
  };
  return (
    <div
      {...props}
      ref={setNodeRef}
      style={{ ...style, width: "100%" }}
      {...attributes}
    >
      <div
        style={{ display: "flex", width: "100%" }}
        ref={props.centenDrag ? setActivatorNodeRef : undefined}
      >
        <SkipExport>
          <MenuOutlined
            ref={props.centenDrag ? undefined : setActivatorNodeRef}
            style={{ touchAction: "none", cursor: "move" }}
            {...listeners}
          />
        </SkipExport>
        {children}
      </div>
    </div>
  );
}
