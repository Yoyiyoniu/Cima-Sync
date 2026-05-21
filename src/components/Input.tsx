import { useEffect, useRef } from "react";

interface InputWithIconProps {
    id: string
    type: string
    label: string
    placeholder: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    disabled?: boolean
    loading?: boolean
    icon?: React.ReactNode
    error?: string
}

export const Input = ({
    id,
    type,
    label,
    placeholder,
    value,
    onChange,
    disabled = false,
    loading = false,
    icon,
    error,
}: InputWithIconProps) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const inputBorderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!error) return;
        const wrap = wrapRef.current;
        const inputEl = inputBorderRef.current;
        if (!wrap || !inputEl) return;

        wrap.classList.add("is-error");
        inputEl.classList.add("is-error");

        inputEl.classList.remove("is-shaking");
        void inputEl.offsetWidth;
        inputEl.classList.add("is-shaking");

        const shakeMs = 80 * 2 + 60 * 2;
        const shakeTimer = setTimeout(() => inputEl.classList.remove("is-shaking"), shakeMs + 20);

        if ((wrap as HTMLDivElement & { _revertTimer?: ReturnType<typeof setTimeout> })._revertTimer) {
            clearTimeout((wrap as HTMLDivElement & { _revertTimer?: ReturnType<typeof setTimeout> })._revertTimer);
        }
        const hold = 3000;
        (wrap as HTMLDivElement & { _revertTimer?: ReturnType<typeof setTimeout> })._revertTimer = setTimeout(() => {
            wrap.classList.remove("is-error");
            inputEl.classList.remove("is-error");
        }, shakeMs + hold);

        return () => {
            clearTimeout(shakeTimer);
        };
    }, [error]);

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-white font-medium text-sm">
                {label}
            </label>
            {loading ? (
                <div className="skeleton-shine h-[38px] w-full rounded-md bg-black/40 border border-[#006633]/20" />
            ) : (
                <div className="t-input-wrap" ref={wrapRef}>
                    <div className="t-input relative" ref={inputBorderRef}>
                        {icon && (
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                {icon}
                            </div>
                        )}
                        <input
                            id={id}
                            type={type}
                            placeholder={placeholder}
                            value={value}
                            onChange={onChange}
                            required
                            disabled={disabled}
                            className={`w-full px-4 py-2 bg-black/40 border border-[#006633]/30 rounded-md text-white placeholder-gray-500
                            focus:outline-none focus:ring-2 focus:ring-[#006633] focus:border-[#006633]
                            disabled:opacity-50 disabled:cursor-not-allowed`}
                        />
                    </div>
                    {error && <p className="t-error-msg text-red-400 text-xs mt-1">{error}</p>}
                </div>
            )}
        </div>
    );
};
