
export function Card({ children, className }) {
  return <div className={`rounded-2xl p-4 shadow-2xl backdrop-blur-lg ${className}`}>{children}</div>;
}
export function CardContent({ children, className }) {
  return <div className={`${className}`}>{children}</div>;
}
