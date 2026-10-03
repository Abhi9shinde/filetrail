import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";

function App() {
  return (
    <div className="flex h-screen bg-[#0b0b0d]">
      <Sidebar />
      <Home />
    </div>
  );
}

export default App;
