'use client';

import { memo, ComponentType } from 'react';
import StatusBar from '../StatusBar';

interface StatusBarColors {
    backgroundColor: string;
    textColor: string;
}

interface HomeScreenAppContainerProps {
    Component: ComponentType | null;
    appContainerRef: React.RefObject<HTMLDivElement>;
    isSwipingFromBottom: boolean;
    swipeUpPosition: number;
    isSwiping: boolean;
    isDraggingSwipe: boolean;
    currentApp: string | null;
    appToOpen: string | null;
    statusBarColors: StatusBarColors;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
}

function HomeScreenAppContainer({
    Component,
    appContainerRef,
    isSwipingFromBottom,
    swipeUpPosition,
    isSwiping,
    isDraggingSwipe,
    currentApp,
    appToOpen,
    statusBarColors,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
}: HomeScreenAppContainerProps) {
    if (!((currentApp && Component) || (appToOpen && Component))) {
        return null;
    }

    const getTransition = () => {
        // Disable transition during active drag for smooth following
        if (isDraggingSwipe) return 'none';

        // Enable transition when:
        // 1. App is opening (swiping up from bottom)
        if (isSwiping && appToOpen)
            return 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        // 2. App is closing (swipe up completed or returning)
        if (isSwipingFromBottom)
            return 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        // 3. App is open and stable
        if (currentApp && !isSwiping && !isSwipingFromBottom)
            return 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        // Default: no transition
        return 'none';
    };

    return (
        <div
            ref={appContainerRef}
            className="ios-app fixed inset-0 z-50 bg-white dark:bg-black"
            style={{
                transform: isSwipingFromBottom
                    ? `translateY(-${swipeUpPosition}%)`
                    : 'translateY(0)',
                opacity: isSwipingFromBottom && swipeUpPosition > 80 ? 0 : 1,
                transition: getTransition(),
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Status Bar inside app - always visible */}
            <div className="fixed top-0 left-0 right-0 z-60 pointer-events-none">
                <StatusBar
                    backgroundColor={statusBarColors.backgroundColor}
                    textColor={statusBarColors.textColor}
                />
            </div>
            <div className="w-full h-full relative overflow-hidden pt-safe-top">
                {Component && <Component />}
                {/* iOS Bottom Bar Indicator */}
                <div
                    className="ios-bottom-bar absolute bottom-0 left-0 right-0 flex items-center justify-center safe-area-bottom"
                    style={{
                        height: '44px',
                        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
                        paddingTop: '12px',
                    }}
                >
                    <div
                        className="ios-bottom-bar-handle w-40 h-1.5 rounded-full transition-colors duration-300"
                        style={{ backgroundColor: statusBarColors.textColor }}
                    />
                </div>
            </div>
        </div>
    );
}

export default memo(HomeScreenAppContainer);
