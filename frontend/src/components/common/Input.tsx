"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className, ...rest }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} className={`input ${className || ""}`.trim()} {...rest} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, id, className, ...rest }: TextareaProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <textarea id={inputId} className={`input textarea ${className || ""}`.trim()} {...rest} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
