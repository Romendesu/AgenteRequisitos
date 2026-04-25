import Button from "../layout/Button";
import send from "../../assets/images/send.svg";

export default function PromptLabel() {
    return (
        <div className="w-full max-w-3xl mx-auto mt-10">
            <div className="flex flex-row bg-gray-800 rounded-[28px] p-4 shadow-sm border border-transparent focus-within:border-gray-800 transition-all">
                
                <textarea 
                    rows="1"
                    className="w-full bg-transparent border-none outline-none resize-none text-white placeholder:text-gray-500 text-lg px-2 py-1"
                    placeholder="Introduce tus requisitos o ideas aquí..."
                />

                <div className="hover:opacity-80 transition-opacity">
                    <Button icon={send} />
                </div>
            </div>
        </div>
    );
}