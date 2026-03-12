import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/Button";
import Card from "../components/Card";
import Container from "../components/Container";
import FormField from "../components/FormField";
import Input from "../components/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

  if (auth.token) return <Navigate to={from} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await auth.login(email, senha);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    }
  };

  return (
    <Container size="sm">
      <div className="pt-8 sm:pt-10">
        <Card className="space-y-4">
          <div>
            <h2 className="text-2xl">Entrar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Acesse sua rotina financeira.</p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
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

            {error && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>}

            <Button className="w-full" type="submit">
              Entrar
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link className="text-primary hover:underline" to="/register">
              Registre-se
            </Link>
          </p>
        </Card>
      </div>
    </Container>
  );
}
