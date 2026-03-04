import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { ReactElement } from "react";

export default function RequireAuth({ children }: { children: ReactElement }) {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.token) {
    // redirect to login, saving where we were
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
