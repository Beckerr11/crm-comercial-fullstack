import { Link, Route, Routes } from "react-router-dom";
import { Landing, PublicProposal } from "./crm/pages";
import Workspace from "./crm/Workspace";
import "./crm.css";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Workspace />} />
      <Route path="/app/:section" element={<Workspace />} />
      <Route path="/p/:token" element={<PublicProposal />} />
      <Route
        path="*"
        element={
          <main className="loading">
            <h1>Página não encontrada</h1>
            <Link to="/">Voltar ao início</Link>
          </main>
        }
      />
    </Routes>
  );
}
