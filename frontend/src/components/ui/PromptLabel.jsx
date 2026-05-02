import { useState } from "react";
import send from "../../assets/images/send.svg";

export default function PromptLabel({ onSubmit, placeholder }) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center bg-gray-800 rounded-[28px] px-4 py-3 border border-transparent focus-within:border-gray-600 transition-colors">
      <textarea
        rows="1"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Describe un requisito de tu sistema..."}
        className="flex-1 bg-transparent text-white placeholder:text-gray-500 text-sm outline-none resize-none px-2 leading-6 max-h-40"
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="ml-2 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
      >
        <img src={send} className="w-4 h-4" />
      </button>
    </div>
  );
}
