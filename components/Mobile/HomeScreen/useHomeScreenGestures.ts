import { useRef, useState, useEffect } from 'react';

interface UseHomeScreenGesturesProps {
    isDragging: boolean;
    currentApp: string | null;
    appToOpen: string | null;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    closeApp: (appId: string) => void;
    setCurrentApp: (appId: string | null) => void;
    appContainerRef: React.RefObject<HTMLDivElement>;
}

export function useHomeScreenGestures({
    isDragging,
    currentApp,
    appToOpen,
    currentPage,
    setCurrentPage,
    closeApp,
    setCurrentApp,
    appContainerRef,
}: UseHomeScreenGesturesProps) {
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const [isSwipingFromBottom, setIsSwipingFromBottom] = useState(false);
    const [isDraggingSwipe, setIsDraggingSwipe] = useState(false);
    const [swipeUpPosition, setSwipeUpPosition] = useState(0);

    // Reset swipe state when app closes to prevent blinking
    useEffect(() => {
        if (!currentApp) {
            setIsSwipingFromBottom(false);
            setIsDraggingSwipe(false);
            setSwipeUpPosition(0);
        }
    }, [currentApp]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isDragging) return;
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };

        // Close App Init
        if (currentApp && !isSwipingFromBottom) {
            if (touch.clientY >= window.innerHeight - 40) {
                // Bottom bar area
                setIsSwipingFromBottom(true);
                setSwipeUpPosition(0);
            }
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging || !touchStartRef.current) return;
        const cy = e.touches[0].clientY;
        const startY = touchStartRef.current.y;

        // Close App Swipe Logic
        if (currentApp && isSwipingFromBottom) {
            const progress = Math.max(0, Math.min(100, ((startY - cy) / window.innerHeight) * 100));
            setIsDraggingSwipe(true);
            requestAnimationFrame(() => {
                if (appContainerRef.current) {
                    appContainerRef.current.style.transform = `translate3d(0, -${progress}vh, 0)`;
                    appContainerRef.current.style.transition = 'none';
                    if (progress > 80)
                        appContainerRef.current.style.opacity = `${1 - (progress - 80) / 20}`;
                }
            });
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isDragging || !touchStartRef.current) return;
        const cx = e.changedTouches[0].clientX;
        const cy = e.changedTouches[0].clientY;
        const startX = touchStartRef.current.x;
        const deltaX = cx - startX;

        // Page Swipe Logic
        if (!currentApp && !appToOpen) {
            const SWIPE_THRESHOLD = window.innerWidth * 0.2;
            if (deltaX < -SWIPE_THRESHOLD && currentPage < 1) setCurrentPage(1);
            if (deltaX > SWIPE_THRESHOLD && currentPage > 0) setCurrentPage(0);
        }

        // Close App Swipe Logic
        if (currentApp && isSwipingFromBottom) {
            const deltaY = touchStartRef.current.y - cy;

            if (deltaY > window.innerHeight * 0.2) {
                // Close Animation
                if (appContainerRef.current) {
                    // Force GPU acceleration
                    appContainerRef.current.style.willChange = 'transform, opacity';
                    appContainerRef.current.style.transition =
                        'transform 0.3s ease-out, opacity 0.3s ease-out';
                    appContainerRef.current.style.transform = `translate3d(0, -100vh, 0)`;
                    appContainerRef.current.style.opacity = '0';
                }

                // Reset state AFTER animation matches transition duration
                setTimeout(() => {
                    // Hard hide before state update to prevent blinking
                    if (appContainerRef.current) {
                        appContainerRef.current.style.display = 'none';
                    }

                    requestAnimationFrame(() => {
                        closeApp(currentApp);
                        setCurrentApp(null);
                    });
                }, 450);
            } else {
                // Reset / Cancel Swipe
                if (appContainerRef.current) {
                    appContainerRef.current.style.transition =
                        'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
                    appContainerRef.current.style.transform = 'translate3d(0, 0, 0)';
                }
                setTimeout(() => {
                    setIsSwipingFromBottom(false);
                    setIsDraggingSwipe(false);
                    if (appContainerRef.current) {
                        appContainerRef.current.style.transition = '';
                        appContainerRef.current.style.transform = '';
                    }
                }, 300);
            }
        }

        touchStartRef.current = null;
    };

    return {
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        isSwipingFromBottom,
        isDraggingSwipe,
        swipeUpPosition,
    };
}
