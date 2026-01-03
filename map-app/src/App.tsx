import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { MainLayout } from "./components/Layout/MainLayout";

export default function App() {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return <MainLayout />;
}
