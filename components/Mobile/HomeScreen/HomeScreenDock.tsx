'use client';

import { memo } from 'react';
import AppIcon from '../AppIcon';
import type { AppMetadata } from '../../../types';

interface HomeScreenDockProps {
    apps: AppMetadata[];
    onAppClick: (appId: string) => void;
}

function HomeScreenDock({ apps, onAppClick }: HomeScreenDockProps) {
    return (
        <div className="ios-dock fixed bottom-4 left-4 right-4 h-24 flex items-center justify-around px-6 ios-safe-area">
            {apps.map(app => (
                <AppIcon
                    key={app.id}
                    app={app}
                    isDock={true}
                    onClick={() => onAppClick(app.id)}
                />
            ))}
        </div>
    );
}

export default memo(HomeScreenDock);
