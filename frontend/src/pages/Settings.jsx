import { useRef, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

// ─── Avatar helpers ───────────────────────────────────────────────────────────

function resizeToBase64(file, size = 96) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = url;
  });
}

function AvatarEditor({ user, avatarPreview, onAvatarChange }) {
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeToBase64(file);
    onAvatarChange(base64);
  }

  const initial = (user?.username ?? "?")[0].toUpperCase();
  const src = avatarPreview ?? user?.avatar;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative group w-20 h-20 rounded-full overflow-hidden ring-2 ring-indigo-500/40 hover:ring-indigo-500 transition-all"
      >
        {src ? (
          <img src={src} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white select-none">
            {initial}
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </button>
      <p className="text-xs text-gray-500">Haz clic para cambiar la foto</p>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Sección card ─────────────────────────────────────────────────────────────

function Section({ title, icon, children }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
        <span className="text-indigo-400">{icon}</span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
        {...props}
      />
    </div>
  );
}

function StatusMsg({ msg }) {
  if (!msg) return null;
  const ok = msg.type === "ok";
  return (
    <p className={`text-xs px-1 ${ok ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>
  );
}

// ─── Tema toggle ──────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white font-medium">{isDark ? "Modo oscuro" : "Modo claro"}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {isDark ? "Interfaz en tonos oscuros" : "Interfaz en tonos claros"}
        </p>
      </div>
      <button
        onClick={toggle}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
          isDark ? "bg-indigo-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform duration-300 flex items-center justify-center text-xs
            ${isDark ? "translate-x-6 bg-white" : "translate-x-0 bg-white"}`}
        >
          {isDark ? "🌙" : "☀️"}
        </span>
      </button>
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────

export default function Settings({ user, onClose, onUpdateProfile }) {
  const overlayRef = useRef(null);

  // Perfil
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [profileStatus, setProfileStatus] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Cuenta
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountStatus, setAccountStatus] = useState(null);
  const [accountLoading, setAccountLoading] = useState(false);

  function handleOverlay(e) {
    if (e.target === overlayRef.current) onClose();
  }

  async function saveProfile() {
    setProfileLoading(true);
    setProfileStatus(null);
    const updates = {};
    if (username.trim() && username.trim() !== user?.username) updates.username = username.trim();
    if (avatarPreview) updates.avatar = avatarPreview;
    if (!Object.keys(updates).length) {
      setProfileStatus({ type: "ok", text: "Sin cambios que guardar." });
      setProfileLoading(false);
      return;
    }
    const result = await onUpdateProfile(updates);
    setProfileStatus(
      result.ok
        ? { type: "ok", text: "Perfil actualizado correctamente." }
        : { type: "err", text: result.error ?? "Error al actualizar el perfil." }
    );
    if (result.ok) setAvatarPreview(null);
    setProfileLoading(false);
  }

  async function saveAccount() {
    if (password && password !== confirmPassword) {
      setAccountStatus({ type: "err", text: "Las contraseñas no coinciden." });
      return;
    }
    setAccountLoading(true);
    setAccountStatus(null);
    const updates = {};
    if (email.trim() && email.trim() !== user?.email) updates.email = email.trim();
    if (password) updates.password = password;
    if (!Object.keys(updates).length) {
      setAccountStatus({ type: "ok", text: "Sin cambios que guardar." });
      setAccountLoading(false);
      return;
    }
    const result = await onUpdateProfile(updates);
    setAccountStatus(
      result.ok
        ? { type: "ok", text: "Cuenta actualizada correctamente." }
        : { type: "err", text: result.error ?? "Error al actualizar la cuenta." }
    );
    if (result.ok) {
      setPassword("");
      setConfirmPassword("");
    }
    setAccountLoading(false);
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="modal-panel bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-white font-semibold text-base">Configuración</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── Perfil ── */}
          <Section
            title="Perfil"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          >
            <AvatarEditor
              user={user}
              avatarPreview={avatarPreview}
              onAvatarChange={setAvatarPreview}
            />
            <Field
              label="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu nombre de usuario"
            />
            <StatusMsg msg={profileStatus} />
            <button
              onClick={saveProfile}
              disabled={profileLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {profileLoading ? "Guardando..." : "Guardar perfil"}
            </button>
          </Section>

          {/* ── Cuenta ── */}
          <Section
            title="Cuenta"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            }
          >
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
            <Field
              label="Nueva contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deja vacío para no cambiarla"
            />
            <Field
              label="Confirmar contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
            />
            <StatusMsg msg={accountStatus} />
            <button
              onClick={saveAccount}
              disabled={accountLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {accountLoading ? "Actualizando..." : "Actualizar cuenta"}
            </button>
          </Section>

          {/* ── Apariencia ── */}
          <Section
            title="Apariencia"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            }
          >
            <ThemeToggle />
          </Section>
        </div>
      </div>
    </div>
  );
}
