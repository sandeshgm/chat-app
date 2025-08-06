import React, { useRef, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";
import { FiLogOut } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import userConversation from "../../../assets/zustand/userConversation";
import { useSocketContext } from "../../context/SocketContext";

const Sidebar = ({ onSelectedUser }) => {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [searchUser, setSearchuser] = useState([]);
  const [chatUser, setChatUser] = useState([]);
  const [loading, setLoading] = useState(false);

  const { selectedConversation, setSelectedConversation } = userConversation();

  const { onlineUser, socket } = useSocketContext();
  const [unreadMap, setUnreadMap] = useState({});
  const chatUserRef = useRef(chatUser);
  const onlineUserSet = new Set(onlineUser);

  useEffect(() => {
    chatUserRef.current = chatUser;
  }, [chatUser]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = async (newMessage) => {
      console.log("New MEssage received:", newMessage);

      const senderId =
        newMessage.senderId || newMessage.from || newMessage.userId;
      if (!senderId) {
        console.warn("No sender id found");
        return;
      }

      if (selectedConversation?._id !== senderId) {
        setUnreadMap((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
      }

      const exists = chatUserRef.current.some((u) => u._id === senderId);

      if (!exists) {
        try {
          const { data } = await axios.get(`/api/user/${senderId}`);
          if (data) {
            setChatUser((prev) => [data, ...prev]);
          }
        } catch (error) {
          console.error("Failed to fetch sender user on new message:", error);
        }
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedConversation]);

  useEffect(() => {
    if (!socket) return;

    const handleNewConversation = async ({ senderId }) => {
      try {
        const { data } = await axios.get(`/api/user/${senderId}`);
        if (!data) return;

        setChatUser((prev) => {
          const exists = prev.some((u) => u._id === senderId);
          if (exists) return prev;
          return [data, ...prev];
        });

        setUnreadMap((prev) => ({
          ...prev,
          [senderId]: 1,
        }));
      } catch (error) {
        console.error("Failed to add new conversation:", error);
      }
    };

    socket.on("newConversation", handleNewConversation);

    return () => {
      socket.off("newConversation", handleNewConversation);
    };
  }, [socket]);

  //clear notification and select user on click
  const handleUserClick = (user) => {
    onSelectedUser(user);
    setSelectedConversation(user);

    setUnreadMap((prev) => {
      const newMap = { ...prev };
      delete newMap[user._id];
      return newMap;
    });
  };

  // Load current chatters on mount and on relevant dependencies
  useEffect(() => {
    if (!authUser || !socket) return;

    const chatUserHandler = async () => {
      setLoading(true);
      try {
        const chatters = await axios.get(`/api/user/currentChatters`);
        const data = chatters.data;

        if (data.success === false) {
          console.log(data.message);
          setChatUser([]);
        } else {
          setChatUser(data);

          // IMPORTANT: Do NOT auto-select any user if none selected
          // Only keep selectedConversation if it matches a user in chatUser
          if (
            !selectedConversation ||
            !data.some((u) => u._id === selectedConversation._id)
          ) {
            setSelectedConversation(null);
            onSelectedUser(null);
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    chatUserHandler();
  }, [authUser, socket]);

  // handle search submit
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setLoading(true);
    try {
      const search = await axios.get(`/api/user/search?search=${searchInput}`);
      const data = search.data;
      if (data.success === false) {
        console.log(data.message);
        setSearchuser([]);
      } else {
        if (data.length === 0) {
          toast.info("User Not Found");
          setSearchuser([]);
        } else {
          setSearchuser(data);
        }
      }
    } catch (error) {
      toast.error("Search request failed");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  //back from search result
  const handleSearchBack = () => {
    setSearchuser([]);
    setSearchInput("");
    setSelectedConversation(null);
    onSelectedUser(null);
  };

  //logout
  const handleLogout = async () => {
    const confirmLogout = window.prompt("type 'UserName' to Logout");
    if (confirmLogout === authUser.username) {
      setLoading(true);
      try {
        const logout = await axios.post("/api/auth/logout");
        const data = logout.data;
        if (data.success === false) {
          console.log(data.message);
          setLoading(false);
          return;
        }
        toast.info(data?.message);

        localStorage.removeItem("authUser");
        localStorage.removeItem("privateKey");
        setAuthUser(null);

        setLoading(false);

        navigate("/login");
      } catch (error) {
        setLoading(false);
        console.log("logout", error);
      }
    } else {
      toast.info("Logout cancelled!");
    }
  };

  return (
    <div className="flex flex-col h-full px-4 py-2 border-r-2 border-gray-300">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 backdrop-blur-sm bg-white/30"></div>
          <div className="relative">
            <div className="loading loading-spinner loading-lg text-black"></div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="mb-4 flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            type="text"
            className="w-full pl-4 pr-10 py-2 text-black rounded-full bg-white shadow-md placeholder-gray-500 focus:outline-none"
            placeholder="Search user"
          />
          <button
            type="submit"
            disabled={loading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-sky-700 hover:text-gray-950 ${
              loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm text-sky-700"></span>
            ) : (
              <FaSearch />
            )}
          </button>
        </form>
      </div>

      <div className="divider px-3"></div>

      {/* Users list */}
      <div className="flex-grow overflow-y-auto space-y-2">
        {searchUser?.length > 0 ? (
          searchUser.map((user) => {
            const isSelected = selectedConversation?._id === user._id;
            return (
              <div key={user._id} className="w-full">
                <div
                  onClick={() => handleUserClick(user)}
                  className={`flex gap-3 items-center p-2 cursor-pointer transition-all w-full ${
                    isSelected ? "bg-sky-500" : "hover:bg-sky-100"
                  }`}
                >
                  {/*Socket is Online */}
                  <div
                    className={`avatar ${
                      onlineUserSet.has(user._id) ? "online" : ""
                    }`}
                  >
                    <div className="relative w-12 h-12">
                      <img
                        src={user?.profilePic}
                        alt="user.img"
                        className="w-full h-full rounded-full object-cover"
                      />
                      {onlineUserSet.has(user._id) && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="text-black">{user.username}</p>
                  </div>
                </div>
                <div className="divider px-3"></div>
              </div>
            );
          })
        ) : chatUser.length === 0 ? (
          <div className="font-bold items-center flex flex-col text-xl text-yellow-500 mt-4">
            <h1>Search username to chat</h1>
          </div>
        ) : (
          chatUser.map((user) => {
            const isSelected = selectedConversation?._id === user._id;
            return (
              <div key={user._id} className="w-full">
                <div
                  onClick={() => handleUserClick(user)}
                  className={`flex gap-3 items-center p-2 cursor-pointer transition-all w-full ${
                    isSelected ? "bg-sky-500" : "hover:bg-sky-100"
                  }`}
                >
                  {/*Socket is online */}
                  <div
                    className={`avatar ${
                      onlineUserSet.has(user._id) ? "online" : ""
                    }`}
                  >
                    <div className="relative w-12 h-12">
                      <img
                        src={user?.profilePic}
                        alt="user.img"
                        className="w-full h-full rounded-full object-cover"
                      />
                      {onlineUserSet.has(user._id) && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="text-black">{user.username}</p>
                  </div>

                  {/*notification */}
                  {unreadMap[user._id] > 0 && !isSelected && (
                    <div className="rounded-full bg-green-700 text-xs text-white px-2 py-0.5">
                      +{unreadMap[user._id]}
                    </div>
                  )}
                </div>
                <div className="divider px-3"></div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom actions */}
      <div className="pt-4 mt-auto">
        {searchUser.length > 0 ? (
          <div
            className="flex items-center gap-2 cursor-pointer text-black hover:text-gray-700"
            onClick={handleSearchBack}
          >
            <IoIosArrowBack size={22} />
            <span className="text-sm font-medium">Back</span>
          </div>
        ) : (
          <div
            onClick={handleLogout}
            disabled={loading}
            className={`flex items-center gap-2 text-black hover:text-red-600 ${
              loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
          >
            <FiLogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
