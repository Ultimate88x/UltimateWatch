import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../../components/Button";
import { Plus, UserX, User, UserPlus, Loader2 } from "lucide-react";
import type { ExternalUserProfile } from "../../types/external-user-profile";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { useAdvancedNavigation } from "../../components/utilities/SmartNavigate";

export default function UserSearchResultsList() {
  const { smartNavigate } = useAdvancedNavigation();

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(false);
  const [userList, setUserList] = useState<ExternalUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [requestLoadingId, setRequestLoadingId] = useState<number | null>(null);

  const [searchParams] = useSearchParams();
  const query = searchParams.get("username");

  useEffect(() => {
    if (!query) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      try {
        const [response] = await Promise.all([
          fetch(`http://localhost:3000/users/search?username=${query}&page=${page}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          wait(800),
        ]);

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Failed to fetch users");
          return;
        }

        setUserList((prev) => {
          if (page === 1) return data.data;

          const existingIds = new Set(prev.map((u) => u.id));
          const uniqueNewData = data.data.filter(
            (item: ExternalUserProfile) => !existingIds.has(item.id)
          );
          return [...prev, ...uniqueNewData];
        });

        setLastPage(data.lastPage);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [page, query]);

  const handleSendFriendRequest = async (e: React.MouseEvent, targetId: number) => {
    e.stopPropagation();
    setRequestLoadingId(targetId);

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      const [response] = await Promise.all([
        fetch(`http://localhost:3000/requests/create/friend-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ receiverId: targetId }),
        }),
        wait(800),
      ]);

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to send friend request");
        return;
      }

      toast.success("Friend request sent successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setRequestLoadingId(null);
    }
  };

  useEffect(() => {
    setPage(1);
    setUserList([]);
  }, [query]);

  if (isLoading && userList.length === 0) {
    return (
      <div className="fixed inset-0 bg-blue-background flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="w-20 h-20 border-4 border-purple-main/20 border-t-purple-main rounded-full" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-white font-inter font-bold tracking-widest uppercase text-sm"
        >
          Searching for users...
        </motion.p>
      </div>
    );
  }

  // Estado vacío
  if (!isLoading && userList.length === 0) {
    return (
      <EmptyState
        title="No Users Found"
        description={`We couldn't find any user matching "${query}"`}
        icon={UserX}
      />
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-blue-background flex flex-col justify-start items-start overflow-x-hidden">
      <div className="relative w-full h-fit px-20 pt-10 flex flex-col justify-start items-start gap-8">
        
        <div className="flex flex-col gap-2">
          <h2 className="relative text-4xl text-white font-bold font-inter uppercase tracking-tight">
            SEARCH RESULTS FOR: USERS - {query}
          </h2>
          <div className="h-1 w-20 bg-purple-main shadow-[0_0_12px_#A855F7] rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {userList.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index % 20) * 0.04 }}
              className="relative group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 hover:border-purple-main/50 transition-all duration-300 cursor-pointer hover:-translate-y-2"
              onClick={() => smartNavigate(`/users/${user.username}`)}
            >
              <div className="relative w-14 h-14 shrink-0 rounded-full border border-purple-main/30 group-hover:border-purple-main overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
                {user.imagePath ? (
                  <img
                    src={user.imagePath}
                    alt={user.username}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <User className="text-purple-main opacity-60" size={24} />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-purple-main/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold truncate group-hover:text-purple-main transition-colors uppercase tracking-wider text-sm">
                  {user.username}
                </h3>
                <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">
                  View profile
                </p>
              </div>

              <button
                disabled={requestLoadingId === user.id}
                onClick={(e) => handleSendFriendRequest(e, user.id)}
                className="relative z-20 p-2.5 rounded-xl bg-purple-main/10 border border-purple-main/20 text-purple-main hover:bg-purple-main hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestLoadingId === user.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <UserPlus size={18} />
                )}
              </button>

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-purple-main shadow-[0_0_10px_#A855F7] transition-all duration-500 group-hover:w-full rounded-full" />
            </motion.div>
          ))}
        </div>

        {userList.length > 0 && !lastPage && (
          <div className="relative w-full mt-10 pb-20 flex justify-center z-10">
            <Button
              variant="ghost"
              size="lg"
              icon={Plus}
              isLoading={isLoading}
              showShine={true}
              className="w-80 border border-purple-main/20 hover:border-purple-main/50 rounded-full hover:bg-purple-main/10 text-white/80 hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] [&_svg]:hover:rotate-180"
              onClick={() => setPage((prev) => prev + 1)}
            >
              Load More Users
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}