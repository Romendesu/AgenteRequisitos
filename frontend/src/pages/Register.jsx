import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Register() {
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [localErrors, setLocalErrors] = useState([]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const errors = [];
    if (!/^[\w.+\-]+@[\w\-]+\.\w{2,}$/.test(form.email)) {
      errors.push("Correo electrónico inválido");
    }
    if (!form.username.trim()) {
      errors.push("El nombre de usuario no puede estar vacío");
    }
    if (form.password.length < 8) {
      errors.push("La contraseña debe tener al menos 8 caracteres");
    }
    if (!/[A-Z]/.test(form.password)) {
      errors.push("La contraseña debe contener al menos una letra mayúscula");
    }
    if (!/\d/.test(form.password)) {
      errors.push("La contraseña debe contener al menos un número");
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (errors.length) {
      setLocalErrors(errors);
      return;
    }
    setLocalErrors([]);
    const ok = await register(form.email, form.username.trim(), form.password);
    if (ok) navigate("/");
  }

  const allErrors = [...localErrors, ...(error ? [error] : [])];

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white mx-auto">
            M
          </div>
          <h1 className="text-2xl font-extrabold text-white">Crear cuenta</h1>
          <p className="text-gray-400 text-sm">Empieza a gestionar tus requisitos con IA</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              placeholder="tu@email.com"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre de usuario
            </label>
            <input
              type="text"
              required
              value={form.username}
              onChange={set("username")}
              placeholder="Tu nombre"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={set("password")}
              placeholder="Mín. 8 chars, 1 mayúscula, 1 número"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
            />
          </div>

          {allErrors.length > 0 && (
            <ul className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 space-y-0.5 list-disc list-inside">
              {allErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
