import "./App.css";
import { BrowserRouter, Navigate, Route, Routes, Link, useLocation } from "react-router-dom";
import MapPage from "@/pages/MapPage";
import PinIndexPage from "@/pages/PinIndexPage";

function Header() {
  const loc = useLocation();
  const tab = (to: string, label: string) => (
    <Link to={to} className={`px-3 py-2 border-b-2 ${loc.pathname === to ? "border-blue-600 text-blue-600" : "border-transparent"}`}>{label}</Link>
  );
  return (
    <header className="bg-white border-b">
      <div className="max-w-5xl mx-auto flex gap-4 items-center h-12 px-4">
        <div className="font-semibold">さとまるマップ</div>
        <nav className="flex gap-2">
          {tab("/map", "Map")}
          {tab("/pins", "Pins")}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/pins" element={<PinIndexPage />} />
      </Routes>
    </BrowserRouter>
  );
}

