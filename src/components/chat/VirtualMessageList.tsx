import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MessageBubble, TypingBubble, type DeliveryState } from "./MessageBubble";

export type ChatItem = {
  id: string;
  mine: boolean;
  text: string;
  time?: string;
  state?: DeliveryState;
};

/**
 * Mobile-first virtualized message list.
 * Only rows near the viewport are mounted, which keeps long chat threads
 * smooth on phones. Rows are dynamically measured so bubbles can wrap freely.
 */
export function VirtualMessageList({
  items,
  typingName,
  header,
  empty,
  reactions,
  onReact,
}: {
  items: ChatItem[];
  typingName?: string | null;
  header?: ReactNode;
  empty?: ReactNode;
  /** messageId -> emojis attached to it */
  reactions?: Record<string, string[]>;
  onReact?: (messageId: string, emoji: string, origin: { x: number; y: number }) => void;
}) {

  const parentRef = useRef<HTMLDivElement | null>(null);
  const [stick, setStick] = useState(true);

  // Typing indicator is the last virtual row when active.
  const count = items.length + (typingName ? 1 : 0);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 8,
    getItemKey: (i) => (i < items.length ? items[i].id : "typing"),
  });

  // Track whether the user is pinned to the bottom (so we don't yank them
  // away while they're reading history).
  const onScroll = () => {
    const el = parentRef.current;
    if (!el) return;
    setStick(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  useLayoutEffect(() => {
    if (!stick || count === 0) return;
    virtualizer.scrollToIndex(count - 1, { align: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, stick]);

  // Re-pin after the on-screen keyboard resizes the viewport on mobile.
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const handler = () => {
      if (stick && count > 0) virtualizer.scrollToIndex(count - 1, { align: "end" });
    };
    vv.addEventListener("resize", handler);
    return () => vv.removeEventListener("resize", handler);
  }, [stick, count, virtualizer]);

  return (
    <div
      ref={parentRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto overscroll-contain py-3 [-webkit-overflow-scrolling:touch]"
    >
      {header ? <div className="pb-3">{header}</div> : null}
      {items.length === 0 && !typingName ? empty : null}
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => {
          const item = row.index < items.length ? items[row.index] : null;
          return (
            <div
              key={row.key}
              ref={virtualizer.measureElement}
              data-index={row.index}
              className="absolute left-0 top-0 w-full pb-3"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              {item ? (
                <MessageBubble mine={item.mine} text={item.text} time={item.time} state={item.state} />
              ) : (
                <TypingBubble name={typingName ?? ""} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
