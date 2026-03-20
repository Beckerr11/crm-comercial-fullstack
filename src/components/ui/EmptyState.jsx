export default function EmptyState({ message, className = "" }) {
  return <p className={["empty-state", className].filter(Boolean).join(" ")}>{message}</p>
}
