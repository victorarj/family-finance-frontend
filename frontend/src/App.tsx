// src/App.tsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import Dashboard from "./components/Dashboard.tsx";
import ExpensesPage from "./pages/ExpensesPage.tsx";
import IncomePage from "./pages/IncomePage.tsx";

export default function App() {
  // TODO: Replace with real authentication
  const [currentUserEmail] = useState("admin@example.com");

  return (
    <BrowserRouter>
      <nav style={{ padding: "10px", backgroundColor: "#f5f5f5" }}>
        <Link to="/" style={{ marginRight: "20px" }}>
          Dashboard
        </Link>
        <Link to="/expenses" style={{ marginRight: "20px" }}>
          Despesas
        </Link>
        <Link to="/income" style={{ marginRight: "20px" }}>
          Receitas
        </Link>
        <span style={{ fontSize: "12px", color: "#666" }}>
          Usuário: {currentUserEmail}
        </span>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/expenses"
          element={<ExpensesPage currentUserEmail={currentUserEmail} />}
        />
        <Route
          path="/income"
          element={<IncomePage currentUserEmail={currentUserEmail} />}
        />
      </Routes>
    </BrowserRouter>
  );
}
