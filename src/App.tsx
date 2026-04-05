import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminNews from "./pages/AdminNews";
import AdminEvents from "./pages/AdminEvents";

/**
 * 路由：/ 前台；/admin 後台總覽；/admin/news；/admin/events 活動集錦後台。
 * 搭配 HashRouter 時實際網址為 …#/admin/…
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/news" element={<AdminNews />} />
      <Route path="/admin/events" element={<AdminEvents />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
