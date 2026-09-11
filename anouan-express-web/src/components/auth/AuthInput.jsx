import React from 'react';

export default function AuthInput({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  rightSlot,
  required = false,
  className = '',
  inputClassName = '',
  ...props
}) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
        )}
        <input
          id={id}
          name={name || id}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${rightSlot ? 'pr-10' : 'pr-4'} py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all ${inputClassName} ${className}`}
          {...props}
        />
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}
