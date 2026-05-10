import { Route, Routes } from "react-router-dom";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import Login from "./auth/login";
import SignUp from "./auth/signup";
import UserProfile from "./user/profile";
import ForgotPassword from "./auth/forgotPassword";
import ResetPassword from "./auth/resetPassword";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import Home from "./home";
import SeriesList from "./content/series/list";
import MovieList from "./content/movies/list";
import SearchResultsList from "./content/search";
import MovieDetail from "./content/movies/detail";
import SeriesDetail from "./content/series/detail";
import UserDetail from "./user/detail";
import UserSearchResultsList from "./user/search";
import FriendRequests from "./request/friend-request-list";
import FriendsList from "./request/friend-list";
import EventList from "./event/list";
import EventDetail from "./event/detail";
import CreateEvent from "./event/create";
import EventRoom from "./event/room";
import EventInvitationRequests from "./request/event-invitation-list";
import CalendarPage from "./event/calendar";

function App() {
  return (
    <div className="flex flex-col bg-blue-background min-h-screen">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 20px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
          },
          success: {
            iconTheme: {
              primary: '#A855F7',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }
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
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/users/:username" element={<UserDetail />} />
            <Route path="/users-search" element={<UserSearchResultsList />} />
            <Route path="/friend-requests" element={<FriendRequests />} />
            <Route path="/friends" element={<FriendsList />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/create" element={<CreateEvent />} />
            <Route path="/events/:id/room" element={<EventRoom />} />
            <Route path="/event-invitations" element={<EventInvitationRequests />} />
            <Route path="/events-calendar" element={<CalendarPage />} />
          </Route>

          <Route path="/" element={<Home />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/series" element={<SeriesList />} />
          <Route path="/movies" element={<MovieList />} />
          <Route path="/media-search" element={<SearchResultsList />} />
          <Route path="/movies/:tmdbId" element={<MovieDetail />} />
          <Route path="/series/:tmdbId" element={<SeriesDetail />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App
