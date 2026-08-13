import axios from "axios";
import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { disconnectSocket, getSocket } from "../socketClient";

const API_URL = "http://localhost:5001";

const ChatPage = () => {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [typingFrom, setTypingFrom] = useState(null);

  // Guard route + connect socket once
  useEffect(() => {
    if (authLoading) return; // wait for AuthContext to restore the session
    if (!user) {
      navigate('/');
      return;
    }

    const socket = getSocket(token);
    socketRef.current = socket;
    socket.connect();

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => {
        const relevant =
          activeContactRef.current &&
          (String(msg.sender) === String(activeContactRef.current.partnerId) ||
            String(msg.receiver) ===
              String(activeContactRef.current.partnerId));
        return relevant ? [...prev, msg] : prev;
      });
      const knownPartner = contactsRef.current.some(
        (c) => String(c.partnerId) === String(msg.sender),
      );
      if (knownPartner) {
        setContacts((prev) =>
          bumpContact(prev, msg.sender, msg.text, msg.createdAt, true),
        );
      } else {
        // First message from someone not yet in the list — refetch so their
        // name/role (from the server) shows up instead of guessing at it here.
        fetchContacts();
      }
    });

    socket.on("messageSent", (msg) => {
      setMessages((prev) => [...prev, msg]);
      setContacts((prev) =>
        bumpContact(prev, msg.receiver, msg.text, msg.createdAt, false),
      );
    });

    socket.on("userOnline", (id) => {
      setOnlineIds((prev) => new Set(prev).add(id));
    });

    socket.on("userOffline", (id) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });

    socket.on("userTyping", ({ sender }) => {
      setTypingFrom(sender);
      setTimeout(
        () => setTypingFrom((current) => (current === sender ? null : current)),
        2000,
      );
    });

    fetchContacts();

    return () => {
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, navigate]);

  // Keep a ref in sync so the socket listener above always knows the active contact
  const activeContactRef = useRef(null);
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  // Same idea, so the socket listener always sees the current contacts list
  const contactsRef = useRef([]);
  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const bumpContact = (list, partnerId, lastMessage, lastMessageAt, unread) => {
    const exists = list.some((c) => String(c.partnerId) === String(partnerId));
    if (!exists) return list; // partner not in contacts list, skip
    return list
      .map((c) =>
        String(c.partnerId) === String(partnerId)
          ? {
              ...c,
              lastMessage,
              lastMessageAt,
              unread:
                unread && activeContactRef.current?.partnerId !== partnerId,
            }
          : c,
      )
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0),
      );
  };

  // Only shows conversations that have actually started — not every provider/
  // homeowner in the system. Starting a brand-new conversation happens via the
  // "Message" button on a provider's profile (see the deep-link handling below).
  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let list = res.data.map((c) => ({
        partnerId: c.partnerId,
        partnerName: c.partnerName,
        partnerRole: c.partnerRole,
        lastMessage: c.lastMessage || "",
        lastMessageAt: c.lastMessageAt || null,
        unread: c.unread || false,
      }));

      // Deep-linked here from a provider profile's "Message" button: make sure
      // that contact shows up (and gets opened) even before any message exists.
      const target = location.state;
      if (target?.contactId) {
        const existing = list.find(
          (c) => String(c.partnerId) === String(target.contactId),
        );
        if (!existing) {
          list = [
            {
              partnerId: target.contactId,
              partnerName: target.contactName,
              partnerRole: target.contactRole,
              lastMessage: "",
              lastMessageAt: null,
              unread: false,
            },
            ...list,
          ];
        }
        setContacts(list);
        openConversation(existing || list[0]);
        navigate(location.pathname, { replace: true }); // consume the deep-link
      } else {
        setContacts(list);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (contact) => {
    setActiveContact(contact);
    setContacts((prev) =>
      prev.map((c) =>
        String(c.partnerId) === String(contact.partnerId)
          ? { ...c, unread: false }
          : c,
      ),
    );
    try {
      const res = await axios.get(
        `${API_URL}/api/messages/${contact.partnerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMessages(res.data);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      setMessages([]);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeContact) return;
    socketRef.current.emit("sendMessage", {
      receiver: activeContact.partnerId,
      text: draft.trim(),
    });
    setDraft("");
  };

  const handleTyping = () => {
    if (activeContact) {
      socketRef.current.emit("typing", { receiver: activeContact.partnerId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-primary-900 text-white">
            <h1 className="text-3xl font-extrabold tracking-tight">Messages</h1>
            <p className="mt-2 text-primary-100">
              {user?.role === "provider"
                ? "Chat with homeowners"
                : "Chat with service providers"}
            </p>
          </div>

          <div className="flex flex-col md:flex-row h-[600px]">
            {/* Contact list */}
            <div className="w-full md:w-1/3 border-r border-slate-100 overflow-y-auto">
              {contacts.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-sm">
                  {user?.role === "provider"
                    ? "No conversations yet. They'll show up here once a homeowner messages you."
                    : "No conversations yet. Message a provider from their profile to start one."}
                </div>
              )}
              {contacts.map((c) => (
                <button
                  key={c.partnerId}
                  onClick={() => openConversation(c)}
                  className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    activeContact?.partnerId === c.partnerId
                      ? "bg-primary-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          onlineIds.has(String(c.partnerId))
                            ? "bg-green-500"
                            : "bg-slate-300"
                        }`}
                      ></span>
                      <p className="font-bold text-slate-900 text-sm">
                        {c.partnerName}
                      </p>
                    </div>
                    {c.unread && (
                      <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-1">
                    {c.lastMessage || "No messages yet"}
                  </p>
                </button>
              ))}
            </div>

            {/* Chat window */}
            <div className="flex-1 flex flex-col">
              {!activeContact ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                  Select a conversation to start chatting.
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <p className="font-bold text-slate-900">
                      {activeContact.partnerName}
                    </p>
                    <span className="text-xs text-slate-400 capitalize">
                      ({activeContact.partnerRole})
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                    {messages.map((m) => {
                      const isMine =
                        String(m.sender) === String(user.id) ||
                        String(m.sender?._id) === String(user.id);
                      return (
                        <div
                          key={m._id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                              isMine
                                ? "bg-primary-600 text-white rounded-br-sm"
                                : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      );
                    })}
                    {typingFrom === String(activeContact.partnerId) && (
                      <p className="text-xs text-slate-400 italic">typing...</p>
                    )}
                    <div ref={scrollRef}></div>
                  </div>

                  <form
                    onSubmit={handleSend}
                    className="p-4 border-t border-slate-100 flex gap-2"
                  >
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Type a message..."
                      className="flex-1 rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim()}
                      className="px-6 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 transition-all shadow-sm active:scale-[0.98]"
                    >
                      Send
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
