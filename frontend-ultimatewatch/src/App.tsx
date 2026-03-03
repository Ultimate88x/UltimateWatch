import { Route, Routes } from "react-router-dom";
import Login from "./auth/login";
import Navbar from "./components/NavBar";

// App.tsx
function App() {
  return (
    <div className="flex flex-col bg-blue-background min-h-screen">
      <Navbar />
      
      <main className="flex-1"> 
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}

export default App
