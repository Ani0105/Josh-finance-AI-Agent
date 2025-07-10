
export function Button({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-pink-600 text-white rounded-xl hover:bg-pink-800 transition"
    >
      {children}
    </button>
  );
}
