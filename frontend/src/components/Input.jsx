export default function Input({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input className={`input ${error ? 'border-rose-400' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}
