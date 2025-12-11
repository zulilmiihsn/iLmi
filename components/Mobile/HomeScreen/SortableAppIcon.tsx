'use client';

import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AppIcon from '../AppIcon';
import type { AppMetadata } from '../../types';

interface SortableAppIconProps {
    app: AppMetadata;
    id: string;
    onClick: (appId: string) => void;
    disabled?: boolean;
    isEmpty?: boolean;
}

function SortableAppIcon({ app, id, onClick, disabled, isEmpty }: SortableAppIconProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1, // Hide original item while dragging (ghost takes over)
        zIndex: isDragging ? 0 : 'auto',
        touchAction: 'pan-x', // Allow horizontal scroll (page swipe)
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            // We attach listeners to the div wrapper if NOT empty/disabled (though disabled hook handles logic, preventing events on empty slots is safer UX)
            {...(isEmpty ? {} : listeners)}
            className={`w-full h-full relative ${isEmpty ? '' : 'cursor-grab'}`}
        >
            {!isEmpty && (
                <AppIcon
                    app={app}
                    onClick={() => {
                        if (!isDragging) onClick(app.id);
                    }}
                />
            )}
        </div>
    );
}

export default memo(SortableAppIcon);
