import { BrowserRouter, Routes, Route } from "react-router-dom";
import WizardPage from "@/pages/WizardPage";
import AdminPage from "@/pages/AdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WizardPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
