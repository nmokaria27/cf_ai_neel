export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="block w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="block w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="block w-2 h-2 bg-brand-500 rounded-full animate-bounce" />
    </div>
  );
}
