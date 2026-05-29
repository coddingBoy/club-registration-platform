function InputField({
  label,
  error,
  as = "input",
  className = "",
  children,
  ...props
}) {
  const Component = as;

  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <Component
        {...props}
        className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
      >
        {children}
      </Component>
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
    </label>
  );
}

export default InputField;
