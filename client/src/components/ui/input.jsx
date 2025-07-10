
export function Input({ type = "text", value, onChange, placeholder, onKeyDown }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
    />
  );
}
