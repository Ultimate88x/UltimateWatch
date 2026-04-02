import { Route, Routes } from "react-router-dom";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import Login from "./auth/login";
import SignUp from "./auth/signup";
import UserDetails from "./user/userDetails";
import ForgotPassword from "./auth/forgotPassword";
import ResetPassword from "./auth/resetPassword";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import Home from "./home";
import SeriesList from "./content/series/list";
import MovieList from "./content/movies/list";
import SearchResultsList from "./content/searchResults";
import MovieDetail from "./content/movies/detail";
import SeriesDetail from "./content/series/detail";

function App() {
  return (
    <div className="flex flex-col bg-blue-background min-h-screen">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          },
          success: {
            iconTheme: {
              primary: '#6D28D9',
              secondary: '#fff',
            },
          },
        }} 
      />
      
      <Navbar />
      
      <main className="flex-1"> 
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<UserDetails />} />
          </Route>

          <Route path="/" element={<Home />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/series" element={<SeriesList />} />
          <Route path="/movies" element={<MovieList />} />
          <Route path="/search-results" element={<SearchResultsList />} />
          <Route path="/movies/:tmdbId" element={<MovieDetail />} />
          <Route path="/series/:tmdbId" element={<SeriesDetail />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App
