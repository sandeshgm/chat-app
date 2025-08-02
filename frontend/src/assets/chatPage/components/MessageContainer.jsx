import React, { useEffect, useRef, useState } from "react";
import userConversation from "../../../assets/zustand/userConversation";
import { useAuth } from "../../context/AuthContext";
import { TiMessages } from "react-icons/ti";
import { IoIosArrowBack } from "react-icons/io";
import { IoSend } from "react-icons/io5";
import axios from "axios";
import { useSocketContext } from "../../context/SocketContext";
import notify from "../../../assets/sound/messageNotification.mp3";
import {
  encryptMessage as rsaEncrypt,
  decryptMessage as rsaDecrypt,
} from "../../utils/crypto";

const MessageContainer = ({ onBackUser }) => {
  const {
    messages,
    setMessage,
    selectedConversation,
    setSelectedConversation,
  } = userConversation();
  const { authUser, setAuthUser, privateKey } = useAuth();
  const { socket } = useSocketContext();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendData, setSendData] = useState("");
  const lastMessageRef = useRef();

  //Encrypr message with user's public key
  const encryptMessage = (message, publicKey) => {
    return rsaEncrypt(publicKey, message);
  };

  // Decrypt message with user's private key
  const decryptMessage = (encryptedMessage) => {
    const privateKey = localStorage.getItem("privateKey");
    console.log("Private key:", privateKey);
    if (!privateKey) {
      console.error("Private key is missing.");
      return " Cannot decrypt (missing private key)";
    }

    try {
      return rsaDecrypt(privateKey, encryptedMessage);
    } catch (error) {
      console.error("Decryption failed:", error);
      return "Decryption failed";
    }
  };

  //implementing socket io for real time chat application
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      console.log("received message from socket", newMessage);

      const sound = new Audio(notify);
      sound.play();

      const isForCurrentChat =
        selectedConversation &&
        (newMessage.senderId === selectedConversation._id ||
          newMessage.receiverId === selectedConversation._id);

      if (!isForCurrentChat) {
        return;
      }

      if (newMessage.senderId !== authUser._id) {
        const decryptedText = decryptMessage(newMessage.message);
        setMessage([...messages, { ...newMessage, message: decryptedText }]);
      } else {
        const localKey = `messages_${selectedConversation._id}_${authUser._id}`;
        const localMessages = JSON.parse(localStorage.getItem(localKey)) || [];

        const localMessage = localMessages.find(
          (msg) => msg._id === newMessage._id
        );

        const plainText = localMessage
          ? localMessage.message
          : "Message not found";

        setMessage([...messages, { ...newMessage, message: plainText }]);
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => {
      socket?.off("newMessage", handleNewMessage);
    };
  });

  useEffect(() => {
    setTimeout(() => {
      lastMessageRef?.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  useEffect(() => {
    const getMessages = async () => {
      setLoading(true);

      try {
        const get = await axios.get(`/api/message/${selectedConversation._id}`);
        const data = await get.data;

        if (Array.isArray(data)) {
          const decryptedMessages = data.map((msg) => ({
            ...msg,
            message: decryptMessage(msg.message),
          }));
          setMessage(decryptedMessages);
        } else {
          console.log("expected an array of messagesm but received:", data);
        }

        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.log("error at getMessage Message container", error);
      }
    };
    if (selectedConversation?._id) getMessages();
  }, [selectedConversation?._id, setMessage]);

  const handleMessage = (e) => {
    setSendData(e.target.value);
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!sendData.trim()) return;

  //   setSending(true);

  //   try {
  //     const recipientPublicKey = selectedConversation.publicKey;
  //     if (!recipientPublicKey) {
  //       console.error("Recipient does not have a public key.");
  //       setSending(false);
  //       return;
  //     }

  //     // Encrypt message
  //     const encryptedMessage = encryptMessage(sendData, recipientPublicKey);

  //     // Send encrypted message to backend
  //     const res = await axios.post(
  //       `/api/message/send/${selectedConversation._id}`,
  //       { message: encryptedMessage }
  //     );

  //     const data = res.data;

  //     setMessage([
  //       ...messages,
  //       {
  //         ...data.data,
  //         message: sendData,
  //         encryptedMessage,
  //       },
  //     ]);

  //     setSendData("");
  //   } catch (error) {
  //     console.error("Failed to send message:", error);
  //   } finally {
  //     setSending(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sendData.trim()) return;

    setSending(true);

    try {
      const recipientPublicKey = selectedConversation.publicKey;
      if (!recipientPublicKey) {
        console.error("Recipient does not have a public key.");
        setSending(false);
        return;
      }

      // Encrypt message
      const encryptedMessage = encryptMessage(sendData, recipientPublicKey);

      // Send encrypted message to backend
      const res = await axios.post(
        `/api/message/send/${selectedConversation._id}`,
        { message: encryptedMessage }
      );

      const data = res.data;

      // Save sender's message to localStorage using the correct _id from the server
      const localKey = `messages_${selectedConversation._id}_${authUser._id}`;
      const existingMessages = JSON.parse(localStorage.getItem(localKey)) || [];
      const newMessage = {
        _id: data.data._id, // ✅ Use server-provided ID
        senderId: authUser._id,
        message: sendData, // Plain text message
        createdAt: data.data.createdAt, // Optional: use server time
      };
      const updatedMessages = [...existingMessages, newMessage];
      localStorage.setItem(localKey, JSON.stringify(updatedMessages));

      // Add message to state
      setMessage([
        ...messages,
        {
          ...data.data,
          message: sendData,
          encryptedMessage,
        },
      ]);

      setSendData("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col py-2">
      {selectedConversation === null ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="px-4 text-center text-2xl text-gray-950 font-semibold flex flex-col items-center gap-2">
            <p className="text-2xl">Welcome, {authUser.username}</p>
            <p className="text-lg">Select a chat to start message</p>
            <TiMessages className="text-6xl text-center" />
          </div>
        </div>
      ) : (
        <>
          {/* <div className="flex justify-between gap-1 bg-sky-600 px-2 rounded-lg h-12 mb-4">
            <div className="flex gap-2 justify-between items-center w-full">
              <div className="md:hidden ml-1 self-center">
                <button
                  onClick={() => onBackUser(true)}
                  className="bg-black rounded-full px-2 py-1 self-center"
                >
                  <IoIosArrowBack size={24} />
                </button>
              </div>
              <div className="flex justify-between mr-2 gap-2">
                <div className="self-center">
                  <img
                    className="rounded-full w-10 h-10 cursor-pointer"
                    src={selectedConversation?.profilePic}
                    alt=""
                  />
                </div>
                <span className="text-gray-950  text-center text-xl font-bold">
                  {selectedConversation?.username}
                </span>
              </div>
            </div>
          </div> */}
          <div className="relative bg-sky-600 px-2 rounded-lg h-12 mb-4 flex items-center justify-center">
            {/* Back button - left aligned (absolute) */}
            <div className="absolute left-2 md:hidden">
              <button
                onClick={() => onBackUser(true)}
                className="bg-black rounded-full px-2 py-1"
              >
                <IoIosArrowBack size={24} />
              </button>
            </div>

            {/* Profile pic and username - centered */}
            <div className="flex gap-2">
              <img
                className="rounded-full w-10 h-10 cursor-pointer"
                src={selectedConversation?.profilePic}
                alt=""
              />
              <span className="text-gray-950 text-xl font-bold">
                {selectedConversation?.username}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            {loading && (
              <div className="flex w-full h-full flex-col items-center justify-center gap-4 bg-transparent">
                <div className="loading loading-spinner"></div>
              </div>
            )}
            {!loading && messages?.length === 0 && (
              <p className="text-center text-black items-center py-10">
                Send a message to start Conversation
              </p>
            )}
            {/* {!loading &&
              Array.isArray(messages) &&
              messages?.length > 0 &&
              messages?.map((message) => ( */}
            {!loading &&
              Array.isArray(messages) &&
              messages?.length > 0 &&
              messages
                ?.map((message) => {
                  if (message.senderId === authUser._id) {
                    // Fetch sender's message from localStorage
                    const localKey = `messages_${selectedConversation._id}_${authUser._id}`;
                    const localMessages =
                      JSON.parse(localStorage.getItem(localKey)) || [];
                    // Try to find this message by _id or createdAt
                    const localMessage = localMessages.find(
                      (msg) => msg._id === message._id
                    );
                    if (localMessage) {
                      return { ...message, message: localMessage.message };
                    }
                  }
                  // Return as is for receiver's message (already decrypted)
                  return message;
                })
                .map((message) => (
                  <div
                    key={message?._id}
                    ref={lastMessageRef}
                    className={`chat mb-4 ${
                      message.senderId === authUser._id
                        ? "chat-end pr-0"
                        : "chat-start pl-0"
                    }`}
                  >
                    <div className="chat-image avatar"></div>
                    <div
                      className={`flex flex-col ${
                        message.senderId === authUser._id
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      <div
                        className={`chat-bubble p-3 rounded-lg break-words max-w-xs sm:max-w-md md:max-w-lg whitespace-pre-wrap ${
                          message.senderId === authUser._id
                            ? "bg-sky-600 text-white"
                            : "bg-gray-600 text-white"
                        }`}
                      >
                        {message?.message}
                      </div>

                      <div className="text-[10px] opacity-80 text-black mt-1">
                        {message?.createdAt ? (
                          !isNaN(new Date(message?.createdAt).getTime()) ? (
                            <>
                              {new Intl.DateTimeFormat("en-IN", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                timeZone: "Asia/Kathmandu",
                              }).format(new Date(message?.createdAt))}
                              <span className="ml-2">
                                {new Intl.DateTimeFormat("en-IN", {
                                  hour: "numeric",
                                  minute: "numeric",
                                  timeZone: "Asia/Kathmandu",
                                }).format(new Date(message?.createdAt))}
                              </span>
                            </>
                          ) : (
                            <span className="text-red-500">Invalid Date</span>
                          )
                        ) : (
                          <span className="text-gray-500">
                            Date not available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
          </div>
          <form
            onSubmit={handleSubmit}
            action=""
            className="rounded-full text-black mt-2 px-2"
          >
            <div className="w-full rounded-full flex items-center bg-white">
              <input
                type="text"
                value={sendData}
                onChange={handleMessage}
                required
                id="message"
                className="w-full bg-transparent outline-none px-4 rounded-full"
              />
              <button type="submit">
                {sending ? (
                  <div className="loading loading-spinner"></div>
                ) : (
                  <IoSend
                    size={23}
                    className="text-sky-700 cursor-pointer rounded-full bg-gray-800 w-10 h-auto p-1"
                  />
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default MessageContainer;
