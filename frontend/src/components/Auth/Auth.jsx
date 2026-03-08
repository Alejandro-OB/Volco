import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Mail,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  LogIn,
  Eye,
  EyeOff
} from "lucide-react";
import api from "../../api/axiosConfig";
import logoVolco from "../../assets/logo_new.png";

function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    document_number: "",
    email: "",
    username: "",
    password: "",
    password2: ""
  });

  useEffect(() => {
    setError("");
    setSuccess("");
    setShowPassword(false);
  }, [isLogin]);

  const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", loginData.username);
      formData.append("password", loginData.password);
      const res = await api.post("token/", formData);
      onLoginSuccess(res.data.access_token, res.data.refresh_token);
      navigate("/clientes");
    } catch (err) {
      setError(err.response?.status === 401 ? "Usuario o contraseña incorrectos." : "Error de conexión.");
    } finally { setLoading(false); }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.password2) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    try {
      const { password2, ...payload } = registerData;
      await api.post("providers/", payload);
      setSuccess("¡Cuenta creada!");
      setTimeout(() => setIsLogin(true), 2000);
    } catch (err) { setError("Error al crear la cuenta."); }
    finally { setLoading(false); }
  };

  // Clases Reutilizables
  const inputClass = "w-full rounded-2xl bg-white/50 border-2 border-slate-100 pl-12 pr-4 py-3.5 text-slate-700 placeholder:text-slate-400 input-fancy font-medium text-sm";
  const labelClass = "text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1 flex items-center";
  const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#f58d2f] transition-colors";
  const buttonClass = "group relative inline-flex items-center justify-center gap-2 w-full max-w-[240px] rounded-xl border border-orange-600/20 bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] px-10 py-3.5 text-sm font-bold text-white shadow-[0_8px_16px_-4px_rgba(245,141,47,0.4)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_20px_-4px_rgba(245,141,47,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

  const Required = () => <span className="text-red-500 ml-1" title="Obligatorio">*</span>;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 font-sans selection:bg-[#f58d2f]/30">
      <section className={`w-full transition-all duration-500 ${isLogin ? 'max-w-[460px]' : 'max-w-[620px]'}`}>
        <div className="glass-panel rounded-[2.5rem] p-8 sm:p-14 relative overflow-hidden">
          
          <div className="text-center mb-10">
            <img src={logoVolco} alt="VOLCO" className="h-28 w-auto mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-900">{isLogin ? "¡Bienvenido!" : "Únete a Volco"}</h2>
          </div>

          {(error || success) && (
            <div className={`flex items-center gap-3 p-4 mb-8 rounded-2xl border animate-bounce-short ${error ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"}`}>
              {error ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
              <span className="text-[11px] font-bold uppercase">{error || success}</span>
            </div>
          )}

          {isLogin ? (
            /* --- LOGIN --- */
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className={labelClass}>Usuario <Required /></label>
                <div className="relative group">
                  <User className={iconClass} />
                  <input type="text" name="username" value={loginData.username} onChange={handleLoginChange} placeholder="Ej. usuario_volco" className={inputClass} required />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={labelClass}>Contraseña <Required /></label>
                  <button type="button" onClick={() => navigate("/olvido-contraseña")} className="text-[10px] font-bold text-[#f58d2f] hover:text-[#e87a1c] hover:underline uppercase transition-all">
                    ¿La olvidaste?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className={iconClass} />
                  <input type={showPassword ? "text" : "password"} name="password" value={loginData.password} onChange={handleLoginChange} placeholder="••••••••" className={inputClass} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#f58d2f] transition-colors p-1">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button type="submit" disabled={loading} className={buttonClass}>
                  {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={18} /> <span>Entrar</span></>}
                </button>
              </div>
            </form>
          ) : (
            /* --- REGISTRO --- */
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <label className={labelClass}>Nombre / Razón Social <Required /></label>
                  <div className="relative group">
                    <User className={iconClass} />
                    <input type="text" name="name" value={registerData.name} onChange={handleRegisterChange} placeholder="Nombre completo del proveedor" className={inputClass} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>NIT / CC <Required /></label>
                  <div className="relative group">
                    <FileText className={iconClass} />
                    <input type="text" name="document_number" value={registerData.document_number} onChange={handleRegisterChange} placeholder="12345678-9" className={inputClass} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Nombre de Usuario <Required /></label>
                  <div className="relative group">
                    <User className={iconClass} />
                    <input type="text" name="username" value={registerData.username} onChange={handleRegisterChange} placeholder="mi_usuario" className={inputClass} required />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Correo Electrónico <Required /></label>
                <div className="relative group">
                  <Mail className={iconClass} />
                  <input type="email" name="email" value={registerData.email} onChange={handleRegisterChange} placeholder="ejemplo@correo.com" className={inputClass} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className={labelClass}>Contraseña <Required /></label>
                  <div className="relative group">
                    <Lock className={iconClass} />
                    <input type={showPassword ? "text" : "password"} name="password" value={registerData.password} onChange={handleRegisterChange} placeholder="••••••••" className={inputClass} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#f58d2f] transition-colors p-1">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Confirmar <Required /></label>
                  <div className="relative group">
                    <Lock className={iconClass} />
                    <input type={showPassword ? "text" : "password"} name="password2" value={registerData.password2} onChange={handleRegisterChange} placeholder="Repetir contraseña" className={inputClass} required />
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <button type="submit" disabled={loading} className={buttonClass}>
                  {loading ? <Loader2 className="animate-spin" /> : <><UserPlus size={18} /> <span>Registrarme</span></>}
                </button>
              </div>
            </form>
          )}

          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
            <p className="text-sm font-medium text-slate-400">
              {isLogin ? "¿No tienes cuenta?" : "¿Ya estás registrado?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 font-black text-[#f58d2f] hover:text-[#e87a1c] hover:underline underline-offset-4 transition-all uppercase text-[11px] tracking-widest"
              >
                {isLogin ? "Regístrate ahora" : "Inicia sesión"}
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Auth;