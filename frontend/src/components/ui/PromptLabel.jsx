import { useState } from "react";
import Button from "../layout/Button";
import send from "../../assets/images/send.svg";

export default function PromptLabel({ setResponse }) {
  const [text, setText] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/procesar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: text }),
      });

      const data = await res.json();

      // Actualización global del estado
      setRespuesta(data.result);

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-10">
    <div className="flex items-center bg-gray-800 rounded-[28px] px-4 py-3 shadow-sm border border-transparent focus-within:border-gray-600 transition-all">
        
        <textarea 
        rows="1"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Introduce tus requisitos o ideas aquí..."
        className="flex-1 bg-transparent text-white placeholder:text-gray-500 text-lg outline-none resize-none px-2 py-1 leading-tight"
        />

        <div 
        onClick={handleSubmit} 
        className="ml-2 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity select-none"
        >
        <Button icon={send} />
        </div>

    </div>
    </div>
  );
}