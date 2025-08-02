import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import MessageContainer from "./components/MessageContainer";

const ChatPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    if (isMobile) {
      setIsSidebarVisible(false);
    }
  };

  const handleShowSideBar = () => {
    setIsSidebarVisible(true);
    setSelectedUser(null);
  };

  const backgroundStyle = {
    backgroundImage: 'url("/chat_background.jpg")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "100vh",
    padding: "1rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
  };

  return (
    <div style={backgroundStyle}>
      <div
        className="flex w-full h-[80vh] max-w-6xl mx-2 rounded-xl
        shadow-lg bg-opacity-0 backdrop-blur-lg border border-white/30
        overflow-hidden"
      >
        {/* Sidebar */}
        <div
          className={`${
            isSidebarVisible || !isMobile ? "block" : "hidden"
          } w-full md:w-1/3 transition-all duration-300 ease-in-out`}
        >
          <Sidebar onSelectedUser={handleUserSelect} />
        </div>

        {/* Divider on md+ */}
        {!isMobile && selectedUser && (
          <div className="hidden md:block w-px bg-gray-300/50"></div>
        )}

        {/* Message Container */}
        <div
          className={`flex-auto ${
            selectedUser ? "flex" : isMobile ? "hidden" : "flex"
          }`}
          style={{
            minWidth: "0", // Prevent the overflow on the right
            flexGrow: 1, // Make it take up the remaining space
          }}
        >
          <MessageContainer onBackUser={handleShowSideBar} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
