import React from "react";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import Login from "./assets/login/Login";
import Register from "./assets/register/Register";
import { AuthContextProvider } from "./assets/context/AuthContext";
import { VerifyUser } from "./assets/utils/VerifyUser";
import ChatPage from "./assets/chatPage/ChatPage";
import { SocketContextProviver } from "./assets/context/SocketContext";

const queryClient = new QueryClient();

function App() {
  return (
    <>
      <div>
        <ToastContainer />
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthContextProvider>
              <SocketContextProviver>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route element={<VerifyUser />}>
                    <Route path="/" element={<ChatPage />} />
                  </Route>
                </Routes>
              </SocketContextProviver>
            </AuthContextProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </div>
    </>
  );
}

export default App;
