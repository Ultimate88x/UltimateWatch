import { useEffect, useState } from "react";
import ListMedia from "../../components/content/ListMedia";
import toast from "react-hot-toast";

export default function SeriesList() {

  const [seriesList, setSeriesList] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
      const response = await fetch(`http://localhost:3000/series/tmdb-list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to fetch series');
        return;
      }

      console.log(data)

      setSeriesList(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="relative w-full bg-cover bg-blue-background flex flex-col justify-start items-start overflow-x-hidden">
      <div className="relative w-full h-fit px-20 flex flex-col justify-start items-start gap-8">
        <ListMedia title={"DISCOVER SERIES"} mediaItems={seriesList.concat(seriesList).concat(seriesList).concat(seriesList)} />
      </div>
    </div>
  )
}