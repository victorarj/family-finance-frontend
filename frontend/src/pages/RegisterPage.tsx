import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/Button";
import Card from "../components/Card";
import Container from "../components/Container";
import FormField from "../components/FormField";
import Input from "../components/Input";

export default function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();
  const navigate = useNavigate();

  if (auth.token) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await auth.register({ nome, email, senha, telefone });
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no cadastro");
    }
  };

  return (
    <Container>
      <div className="pt-10">
        <Card className="space-y-4">
          <div>
            <h2 className="text-2xl">Criar conta</h2>
            <p className="mt-1 text-sm text-muted-foreground">Comece a organizar as finanças da casa.</p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <FormField label="Nome" required>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </FormField>

            <FormField label="Email" required>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} required />
            </FormField>

            <FormField label="Senha" required>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Telefone">
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </FormField>

            {error && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>}

            <Button className="w-full" type="submit">
              Cadastrar
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link className="text-primary hover:underline" to="/login">
              Entrar
            </Link>
          </p>
        </Card>
      </div>
    </Container>
  );
}
