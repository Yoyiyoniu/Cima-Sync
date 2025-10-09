import { useTranslation } from "react-i18next";

interface InputWithIconProps {
    id: string
    type: string
    label: string
    placeholder: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    disabled?: boolean
    icon?: React.ReactNode
}

export const Input = ({
    id,
    type,
    label,
    placeholder,
    value,
    onChange,
    disabled = false,
    icon,
}: InputWithIconProps) => {
    useTranslation();
    
    
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-white font-medium text-sm">
                {label}
            </label>
            <div className="relative">
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
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors duration-200`}
                />
            </div>
        </div>
    )
}