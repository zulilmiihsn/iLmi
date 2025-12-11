'use client';

import { useDndMonitor } from '@dnd-kit/core';
import { useRef, useEffect } from 'react';

export function DragAutoScroller({ onChangePage }: { onChangePage: (dir: 'next' | 'prev') => void }) {
    const lastZoneRef = useRef<'none' | 'left' | 'right'>('none');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const checkZone = (rect: { left: number; width: number } | null) => {
        if (!rect) return 'none';
        const windowWidth = window.innerWidth;
        const threshold = 60; // Fixed pixels (safer than %) or max 15%
        const leftEdge = Math.max(threshold, windowWidth * 0.1);
        const rightEdge = windowWidth - leftEdge;

        const centerX = rect.left + rect.width / 2;

        if (centerX < leftEdge) return 'left';
        if (centerX > rightEdge) return 'right';
        return 'none';
    };

    const clearTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    useDndMonitor({
        onDragMove(event) {
            const { active } = event;
            const rect = active?.rect?.current?.translated;
            const currentZone = checkZone(rect);

            if (currentZone !== lastZoneRef.current) {
                // Zone changed
                lastZoneRef.current = currentZone;
                clearTimer();

                if (currentZone !== 'none') {
                    // Entered a trigger zone, start timer
                    timerRef.current = setTimeout(() => {
                        onChangePage(currentZone === 'left' ? 'prev' : 'next');
                        // Optional: Do we want repeated scrolls? For paging, usually ONE jump is enough per dwell.
                        // If we want repeated, use setInterval logic. iOS usually does one jump then waits?
                        // Let's stick to one jump. User has to exit zone and re-enter or we reset after jump?
                        // For now, let's just trigger one jump. 
                        // To allow hopping multiple pages, maybe we reset zone to none briefly?
                        lastZoneRef.current = 'none'; // Force re-detection logic if they keep holding?
                        // Actually if they stay holding, onDragMove might not fire if they don't move 1px.
                        // But if page slides, the sensor might update?
                        // Let's keep it simple: One jump per entry.
                    }, 400); // 400ms dwell (snappier)
                }
            }
        },
        onDragEnd() {
            clearTimer();
            lastZoneRef.current = 'none';
        },
        onDragCancel() {
            clearTimer();
            lastZoneRef.current = 'none';
        }
    });

    useEffect(() => clearTimer, []);

    return null;
}
