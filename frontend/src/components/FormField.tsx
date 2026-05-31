import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
};

function FormField({
  label,
  htmlFor,
  required = false,
  error,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`field ${className}`}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required && <span aria-label="required"> *</span>}
      </label>
      {children}
      {error && (
        <p className="field-error" id={`${htmlFor}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
