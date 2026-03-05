import { Route, Routes } from "react-router-dom";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import Login from "./auth/login";
import SignUp from "./auth/signup";
import UserDetails from "./user/userDetails";

function App() {
  return (
    <div className="flex flex-col bg-blue-background min-h-screen">
      <Navbar />
      
      <main className="flex-1"> 
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile" element={<UserDetails />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App
