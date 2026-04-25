export default function IntroductionSection() {
    return (
        <div className="flex items-center justify-center p-8"> 
            <div className="w-full max-w-7xl p-12 rounded-2xl bg-slate-700/50 backdrop-blur-sm shadow-2xl flex flex-col items-center justify-center text-center gap-6">
                
                <h1 className="text-xl font-medium text-slate-400 tracking-wide">
                    La IA que transforma tus ideas en...
                </h1>

                <div className="h-24 overflow-hidden">
                    <span class="text-rotate text-7xl">
                        <span class="justify-items-center">
                            <span className="title font-extrabold">CLASIFICACIÓN TÉCNICA ⚙️</span>
                            <span className="title font-extrabold">PRIORIZACIÓN MOSCOW 🎯</span>
                            <span className="title font-extrabold">REQUISITOS FILTRADOS ✨</span>
                            <span className="title font-extrabold">DOCUMENTACIÓN LISTA 📄</span>
                        </span>
                    </span>
                </div>
            </div>
        </div>
    )
}