import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import type { AppSection } from "./types/navigation";

function App() {
  const [activeSection, setActiveSection] = useState<AppSection>("Home");

  return (
    <div className="flex h-screen bg-[#0b0b0d]">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <Home activeSection={activeSection} onNavigate={setActiveSection} />
    </div>
  );
}

export default App;
