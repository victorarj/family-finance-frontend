import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, Link, Navigate } from "react-router-dom";

export default function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  if (auth.token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await auth.register({ nome, email, senha, telefone });
      // after registration go to login
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Nome: <input value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
        </div>
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
        <div>
          <label>
            Telefone: <input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </label>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Cadastrar</button>
      </form>
      <p>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}
