// src/App.tsx
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import Dashboard from "./components/Dashboard.tsx";
import ExpensesPage from "./pages/ExpensesPage.tsx";
import IncomePage from "./pages/IncomePage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";

function AppContent() {
  const auth = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  return (
    <>
      <nav style={{ padding: "10px", backgroundColor: "#f5f5f5" }}>
        <Link to="/" style={{ marginRight: "20px" }}>
          Dashboard
        </Link>
        {auth.token && (
          <>
            <Link to="/expenses" style={{ marginRight: "20px" }}>
              Despesas
            </Link>
            <Link to="/income" style={{ marginRight: "20px" }}>
              Receitas
            </Link>
          </>
        )}
        <span style={{ fontSize: "12px", color: "#666" }}>
          Usuário: {auth.userEmail || "(não autenticado)"}
        </span>
        {auth.token ? (
          <button onClick={handleLogout} style={{ marginLeft: "20px" }}>
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" style={{ marginLeft: "20px" }}>
              Login
            </Link>
            <Link to="/register" style={{ marginLeft: "10px" }}>
              Registrar
            </Link>
          </>
        )}
      </nav>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/expenses"
          element={
            <RequireAuth>
              <ExpensesPage currentUserEmail={auth.userEmail || ""} />
            </RequireAuth>
          }
        />
        <Route
          path="/income"
          element={
            <RequireAuth>
              <IncomePage currentUserEmail={auth.userEmail || ""} />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
