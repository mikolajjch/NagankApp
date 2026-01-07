import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { MainLayout } from "./components/Layout/MainLayout";
import { Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/app"
        element={user ? <MainLayout /> : <Navigate to="/login" />}
      />

      <Route path="*" element={<Navigate to={user ? "/app" : "/login"} />} />
    </Routes>
  );
}
