import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { MainLayout } from "./components/Layout/MainLayout";
import { Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ padding: "2rem" }}>Ładowanie...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/app"
        element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}
      />

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/app" : "/login"} />}
      />
    </Routes>
  );
}
