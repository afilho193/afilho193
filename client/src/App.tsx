import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import TrackDetail from "./pages/TrackDetail";
import MyTracks from "./pages/MyTracks";
import FeedbackPage from "./pages/Feedback";
import Team from "./pages/Team";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/trilhas/:id" element={<TrackDetail />} />
        <Route path="/minhas-trilhas" element={<MyTracks />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route
          path="/equipe"
          element={
            <ProtectedRoute allow={["MANAGER", "HR"]}>
              <Team />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allow={["HR"]}>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
