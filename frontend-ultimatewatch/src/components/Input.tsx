import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  error?: { field: string; message: string } | null;
}

export const Input = ({ label, name, error, className, ...props }: InputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const hasError = error?.field === name;
  const isPasswordField = props.type === 'password';

  const inputType = isPasswordField 
    ? (isPasswordVisible ? "text" : "password") 
    : props.type;

  return (
    <div className="relative w-full flex flex-col justify-start items-start gap-1">
      <label className="relative font-inter font-medium text-white/90 ml-2 text-sm">
        {label}
      </label>

      <div className="relative w-full">
        <input
          {...props}
          name={name}
          type={inputType}
          className={`
            w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl transition-all text-white placeholder:text-white/40 focus:outline-none 
            ${hasError 
              ? "border-red-500 bg-red-500/10" 
              : "border-white/20 focus:border-purple-main focus:bg-white/20"
            } 
            ${className}
          `}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            {isPasswordVisible ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        )}
      </div>

      {hasError && (
        <span className="text-red-400 text-xs ml-2 mt-1 animate-in fade-in slide-in-from-top-1 font-medium">
          {error.message}
        </span>
      )}
    </div>
  );
};