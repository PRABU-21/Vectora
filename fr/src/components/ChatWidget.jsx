import { useEffect, useMemo, useRef, useState } from "react";
import { sendChatMessage } from "../data/api";

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
      setError("Type a message first.");
      return;
    }
    if (text.length > MAX_LEN) {
      setError(`Keep it under ${MAX_LEN} characters.`);
      return;
    }
    if (!isAuthed) {
      setError("Log in to chat with the assistant.");
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
      const msg = err?.response?.data?.message || "Failed to get a response.";
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
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={toggle}
          className={`flex items-center gap-2 px-4 py-3 rounded-full text-white font-semibold shadow-lg shadow-sky-500/30 bg-gradient-to-r ${accent.gradient} hover:scale-105 transition-transform`}
        >
          <span>Chat</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8m-8 4h5m-3 7l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-5l-4 4z" />
          </svg>
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
            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gradient-to-b from-white via-white to-sky-50">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  msg.role === "assistant"
                    ? `${accent.soft} border ${accent.border} text-gray-900`
                    : "bg-gray-900 text-white ml-auto"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="w-24 h-8 rounded-full bg-sky-100 border border-sky-200 animate-pulse"></div>
            )}
          </div>

          {error && (
            <div className="px-4 pb-2 text-xs text-red-600">{error}</div>
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
