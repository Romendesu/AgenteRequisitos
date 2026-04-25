export default function Button({ icon, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-soft p-2 hover:bg-gray-500 flex items-center gap-3 ${
        children ? "btn-wide justify-start" : "btn-square justify-center"
      }`}
    >
      {icon && (
        <img
          src={icon}
          className="w-5 h-5 flex-shrink-0"
        />
      )}

      {children && (
        <span className="truncate">
          {children}
        </span>
      )}
    </button>
  );
}