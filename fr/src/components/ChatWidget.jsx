import { useEffect, useMemo, useRef, useState } from "react";
import { sendChatMessage } from "../data/api";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";

const MAX_LEN = 2000;

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your sophisticated career assistant. I can analyze match scores, identify missing skills, or provide strategic career advice. How may I assist you today?",
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
      setError(`Message differs from limit by ${text.length - MAX_LEN} characters.`);
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
      const reply = res?.reply || res?.message || "I apologize, I'm unable to formulate a response at this moment.";
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

      <div
        className={`
          fixed bottom-24 right-6 w-[22rem] sm:w-[26rem] h-[32rem] 
          bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col
          transition-all duration-500 ease-in-out origin-bottom-right ring-1 ring-black/5
          ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-10 pointer-events-none"}
        `}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-600/90 to-indigo-700/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/10 shadow-inner">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">Vectora AI</h3>
              <p className="text-indigo-100 text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
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
                    : "bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-br-none shadow-indigo-500/20"
                  }
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

        {/* Error */}
        {error && (
          <div className="px-5 pb-2 text-xs text-rose-500 text-center animate-pulse bg-white">{error}</div>
        )}

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <div className="relative flex items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isAuthed ? "Type your message..." : "Please log in safely..."}
              className="w-full bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-gray-400 text-center mt-2 flex justify-center items-center gap-1">
            <span>Powered by Vectora AI</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>Secure & Private</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
