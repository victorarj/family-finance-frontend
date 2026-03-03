import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  if (auth.token) {
    // already logged in
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await auth.login(email, senha);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Email: <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <div>
          <label>
            Senha: <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </label>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Entrar</button>
      </form>
      <p>
        Não tem conta? <Link to="/register">Registre-se</Link>
      </p>
    </div>
  );
}
