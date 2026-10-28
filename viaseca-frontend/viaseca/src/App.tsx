import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import Layout from "./components/Layout";
import MapPage from "./pages/MapPage";
import AlertsPage from "./pages/AlertsPage";
import ReportsPage from "./pages/ReportsPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<MapPage />} />
            <Route path="alertas" element={<AlertsPage />} />
            <Route path="reportes" element={<ReportsPage />} />
            <Route path="acceso" element={<LoginPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}