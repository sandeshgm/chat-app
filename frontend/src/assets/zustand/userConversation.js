import { create } from "zustand";

const userConversation = create((set) => ({
  selectedConversation: null,
  setSelectedConversation: (selectedConversation) =>
    set({ selectedConversation }),
  messages: [],
  setMessage: (messages) => {
    if (!Array.isArray(messages)) {
      console.error("Expected messages to be an array but got:", messages);
      messages = []; // Set to an empty array if it's not an array
    }
    set({ messages });
  },
}));

export default userConversation;
