import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import ListMedia from "../components/content/ListMedia";

type Media = {
  id: number;
  title: string;
  posterPath: string;
}

export default function Home() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

    const MOCK_MOVIES: Media[] = [
    {
      id: 1,
      title: "Interstellar",
      posterPath: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 2,
      title: "Blade Runner 2049",
      posterPath: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 3,
      title: "The Dark Knight",
      posterPath: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 4,
      title: "Inception",
      posterPath: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 5,
      title: "Mad Max: Fury Road",
      posterPath: "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 6,
      title: "The Martian",
      posterPath: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 7,
      title: "Dune",
      posterPath: "https://images.unsplash.com/photo-1506466010722-395aa2bef877?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 8,
      title: "Arrival",
      posterPath: "https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 9,
      title: "Pulp Fiction",
      posterPath: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=400",
    },
  ];

  return (
    <div className="relative w-full bg-cover bg-blue-background flex flex-col justify-start items-center overflow-x-hidden">
      <div className="relative w-full h-fit py-5 bg-purple-main flex flex-col justify-start items-center">
        <h1 className="relative text-8xl text-white font-bold font-inter">ULTIMATEWATCH</h1>
        <h2 className="relative mt-2 text-4xl text-white font-semibold font-inter">WELCOME BACK! WE'VE BEEN WAITING FOR YOU!</h2>
      </div>
      <div className="relative mt-10 w-full h-fit px-20 flex flex-col justify-start items-start gap-8">
        <ListMedia title="Top-Rated Movies" mediaItems={MOCK_MOVIES} />
  
        <ListMedia title="Top-Rated Series" mediaItems={MOCK_MOVIES} />
      </div>
      {!token && (<div className="relative mt-10 w-fit h-fit border-t flex flex-col justify-center items-start gap-2">
        <h2 className="relative mt-5 text-4xl text-white font-semibold font-inter">Not Registered Yet? Join Us!</h2>
        <div className="relative w-full h-fit px-20 flex justify-center items-start gap-8">
          <Button 
            onClick={() => navigate('/signup')} 
            variant="primary" 
            size="lg" 
            fullWidth 
            className="mt-4"
            >
              Sign Up
          </Button>
    
          <Button 
            onClick={() => navigate('/login')} 
            variant="primary" 
            size="lg" 
            fullWidth 
            className="mt-4"
            >
              Sign In
          </Button>
        </div>
      </div>)}
    </div>
  )
}