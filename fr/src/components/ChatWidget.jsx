import { useEffect, useMemo, useRef, useState } from "react";
import { sendChatMessage } from "../data/api";
import { MessageCircle, X, Bot } from "lucide-react";

const MAX_LEN = 2000;

const ChatWidget = ({ userRole }) => {
  const role = userRole || "applicant";
  const assistantGreeting = useMemo(() => {
    if (role === "recruiter") {
      return "Hi! I can help shortlist applicants, summarize profiles, and draft outreach.";
    }
    return "Hi! I can explain match scores, suggest missing skills, or give quick career tips.";
  }, [role]);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      content: assistantGreeting,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    setIsAuthed(Boolean(localStorage.getItem("token")));
  }, []);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const handleSend = async () => {
    setError("");
    const text = input.trim();
    if (!text) {
      setError("Please type a message first.");
      return;
    }
    if (text.length > MAX_LEN) {
      setError(`Message exceeds limit by ${text.length - MAX_LEN} characters.`);
      return;
    }
    if (!isAuthed) {
      setError("Please sign in to access the assistant.");
      return;
    }

    const pending = { role: "user", content: text };
    setMessages((prev) => [...prev, pending]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const res = await sendChatMessage({ message: text });
      const reply = res?.reply || res?.message || "I couldn't craft a reply just now.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      scrollToBottom();
    } catch (err) {
      const msg = err?.response?.data?.message || "Communication failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => setIsOpen((prev) => !prev);

  const accent = useMemo(
    () => ({
      gradient: role === "recruiter" ? "from-emerald-600 via-green-600 to-teal-700" : "from-sky-600 via-blue-600 to-indigo-700",
      soft: role === "recruiter" ? "bg-emerald-50" : "bg-sky-50",
      border: role === "recruiter" ? "border-emerald-100" : "border-sky-100",
    }),
    [role],
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={toggle}
          className="group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-sky-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:scale-110 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <MessageCircle className="w-7 h-7 relative z-10" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}
      {isOpen && (
        <div className={`w-80 sm:w-96 h-[26rem] rounded-2xl shadow-2xl border ${accent.border} bg-white flex flex-col overflow-hidden`}>
          <div className={`px-4 py-3 bg-gradient-to-r ${accent.gradient} text-white flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-white/80">Vectora Assistant</p>
                <p className="text-sm font-semibold">{role === "recruiter" ? "Hiring help" : "Career help"}</p>
              </div>
            </div>
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent space-y-4 bg-gradient-to-b from-slate-50 to-white">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center mr-2 shrink-0 self-end mb-1">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                )}
                <div
                  className={`
                    max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                    ${msg.role === "assistant"
                      ? "bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm"
                      : "bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-br-none shadow-indigo-500/20"}
                  `}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center mr-2 shrink-0 self-end mb-1">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1 shadow-sm">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="px-5 pb-2 text-xs text-rose-500 text-center animate-pulse bg-white">{error}</div>
          )}

          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isAuthed
                  ? role === "recruiter"
                    ? "Ask about applicants, outreach, or job posts..."
                    : "Ask about matches, skills, or resumes..."
                  : "Log in to start chatting"}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className={`px-3 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${accent.gradient} shadow-md hover:shadow-lg disabled:opacity-60`}
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Max {MAX_LEN} chars. Context-aware replies.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
