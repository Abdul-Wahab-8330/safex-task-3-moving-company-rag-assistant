import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, ShieldCheck } from 'lucide-react';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'assistant', text: "Hello! Welcome to our family-owned moving relocation service. How can I help you plan your move or check our company policies today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  // Helper function to format assistant text with lists and bolding
  const formatAssistantMessage = (text: string) => {
    // Split text into lines to process lists and line breaks
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      let formattedLine = line.trim();

      // Handle bullet points starting with -, *, or numbered lists
      const isBullet = formattedLine.startsWith('- ') || formattedLine.startsWith('* ') || /^\d+\.\s/.test(formattedLine);
      if (isBullet) {
        formattedLine = formattedLine.replace(/^[-*]\s+|\d+\.\s+/, '');
      }

      // Convert **bold** markdown to HTML bold tags
      const parts = formattedLine.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={index} className="ml-4 list-disc my-1 text-slate-200">
            {renderedParts}
          </li>
        );
      }

      // Empty lines become spacing breaks
      if (formattedLine === '') {
        return <div key={index} className="h-2" />;
      }

      return (
        <p key={index} className="my-1 text-slate-200">
          {renderedParts}
        </p>
      );
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage }),
      });

      const data = await response.json();
      const answerText = data.answer || data.response || data.message;

      if (response.ok && answerText) {
        setMessages(prev => [...prev, { sender: 'assistant', text: answerText }]);
      } else {
        setMessages(prev => [...prev, { sender: 'assistant', text: "Sorry, I encountered an error processing your policy question." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'assistant', text: "Failed to connect to the FastAPI backend server on port 8000!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Relocation AI Assistant</h1>
            <p className="text-xs text-slate-400">Family-Owned Moving & Logistics Expert</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>FastAPI Backend Connected</span>
        </div>
      </header>

      {/* Main Chat Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col">
        <section className="flex-1 bg-slate-800/50 border border-slate-700/60 rounded-2xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-sm">
          
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-sm">Policy & Relocation Assistant Chat</h2>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-blue-400'}`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                {/* Message Bubble with Formatter */}
                <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'}`}>
                  {msg.sender === 'assistant' ? (
                    <div className="space-y-1">
                      {formatAssistantMessage(msg.text)}
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-blue-400 flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-400 animate-pulse">
                  Searching moving policies & generating answer via Gemini...
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 bg-slate-800 border-t border-slate-700 flex items-center space-x-2">
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about moving rates, packing policies, insurance, storage..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-all font-medium flex items-center space-x-2 shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </section>

        {/* Footer info */}
        <div className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Powered by FastAPI, Pinecone Vector DB, and Google Gemini AI</span>
        </div>
      </main>
    </div>
  );
}