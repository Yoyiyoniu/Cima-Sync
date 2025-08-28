import { useEffect, useState } from 'react';
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import { useTranslation } from 'react-i18next';

export const AutoStartConfig = () => {
    const { t } = useTranslation();
    const [autoRunEnabled, setAutoRunEnabled] = useState(false);

    useEffect(() => {
        const loadInitialState = async () => {
            try {
                const enabled = await isEnabled();
                setAutoRunEnabled(enabled);
            } catch (error) {
                console.error('Error al cargar el estado inicial:', error);
                setAutoRunEnabled(false);
            }
        };
        loadInitialState();
    }, []);

    const handleAutoRunToggle = async () => {
        try {
            if (autoRunEnabled) {
                await disable();
                setAutoRunEnabled(false);
            } else {
                await enable();
                setAutoRunEnabled(true);
            }
        } catch (error) {
            setAutoRunEnabled(!autoRunEnabled);
            console.error('Error al cambiar el estado del auto-run:', error);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between w-full p-3 transition-colors duration-200 hover:bg-white/10 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <title>Auto-run</title>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-white font-medium text-sm">{t('Settings.autoRun.title')}</p>
                        <p className="text-white/60 text-xs">{t('Settings.autoRun.description')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={autoRunEnabled}
                            onChange={handleAutoRunToggle}
                        />
                        <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>
        </div>
    );
};
