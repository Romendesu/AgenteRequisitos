export default function Button({ icon, children, onClick, variant = "default" }) {
  const isDock = variant === "dock";
  const hasText = !!children;

  return (
    <button
      onClick={onClick}
      className={`transition-all ${
        isDock
          ? "flex flex-col items-center gap-1 text-xs"
          : "flex items-center gap-2 btn btn-soft p-2 hover:bg-gray-500 justify-start"
      } ${!hasText && !isDock ? "btn-square justify-center" : ""}`}
    >
      {icon && (
        <img
          src={icon}
          className={`flex-shrink-0 ${isDock ? "w-6 h-6" : "w-5 h-5"}`}
        />
      )}

      {hasText && (
        <span className={`${isDock ? "dock-label text-center" : "text-left w-full"}`}>
          {children}
        </span>
      )}
    </button>
  );
}