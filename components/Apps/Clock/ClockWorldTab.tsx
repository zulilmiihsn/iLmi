'use client';

import { memo } from 'react';

interface CityTimeData {
    city: string;
    timezone: string;
    offset: number;
    time: string;
    dayLabel: string;
    hourDiffString: string;
}

interface ClockWorldTabProps {
    cityTimes: CityTimeData[];
    direction: 'forward' | 'backward';
    theme: {
        text: string;
        textSecondary: string;
        border: string;
        activeItem: string;
    };
}

function ClockWorldTab({ cityTimes, direction, theme }: ClockWorldTabProps) {
    return (
        <div
            key="world"
            className={`h-full ${direction === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}
        >
            {cityTimes.map(city => (
                <div
                    key={city.city}
                    className={`px-6 py-4 border-b ${theme.border} ${theme.activeItem} transition-colors`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className={`${theme.text} text-xl font-medium mb-1`}>{city.city}</div>
                            <div className={`${theme.textSecondary} text-sm font-normal`}>
                                {city.dayLabel}, {city.hourDiffString}
                            </div>
                        </div>
                        <div className={`${theme.text} text-xl font-light ml-4`}>{city.time}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default memo(ClockWorldTab);
