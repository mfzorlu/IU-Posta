import React, { useState, useEffect, useRef } from 'react'
import { Send, ShieldCheck, Lock, Hash, Menu } from 'lucide-react'

export function ChatWindow({ channel, messages, onSendMessage, onToggleSidebar }) {
    const [input, setInput] = useState('')
    const scrollRef = useRef()

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = (e) => {
        e.preventDefault()
        if (input.trim()) {
            onSendMessage(input)
            setInput('')
        }
    }

    if (!channel) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 p-6 sm:p-8 relative">
                <button
                    onClick={onToggleSidebar}
                    className="absolute top-4 left-4 p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 md:hidden"
                >
                    <Menu size={20} />
                </button>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-500/5 flex items-center justify-center text-blue-500/20 mb-6 border border-blue-500/10">
                    <Hash size={32} className="sm:size-10" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-center">Welcome to IU Posta</h2>
                <p className="text-slate-500 mt-2 max-w-sm text-center text-sm">Select a channel from the sidebar to start messaging securely with other students.</p>
                <div className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/5 border border-green-500/20 text-green-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                    <ShieldCheck size={12} />
                    End-to-End Encryption Enabled
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-950 min-w-0 overflow-hidden">
            {/* Header */}
            <div className="h-14 px-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2 min-w-0">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white md:hidden"
                    >
                        <Menu size={20} />
                    </button>
                    <Hash className="text-slate-500 flex-shrink-0" size={20} />
                    <h3 className="font-bold truncate">{channel.name}</h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] sm:text-xs font-mono text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-blue-400">
                        <Lock size={12} />
                        <span className="hidden sm:inline">E2EE Active</span>
                        <span className="sm:hidden">Secure</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                {messages.map((msg, i) => (
                    <div key={msg.id || i} className="group flex gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600 transition-colors text-xs sm:text-base">
                            {msg.sender_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1 overflow-hidden">
                                <span className="font-bold text-xs sm:text-sm text-blue-200 truncate">{msg.sender_name}</span>
                                <span className="text-[9px] sm:text-[10px] text-slate-500 flex-shrink-0">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity text-[8px] px-1 rounded bg-slate-800 text-slate-500 items-center gap-1 uppercase tracking-tighter self-center">
                                    <Lock size={8} /> Encrypted
                                </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed text-sm sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-3 sm:p-4 bg-gradient-to-t from-slate-950 to-transparent">
                <form
                    onSubmit={handleSend}
                    className="relative w-full max-w-4xl mx-auto"
                >
                    <input
                        type="text"
                        placeholder={`Message #${channel.name}`}
                        className="w-full bg-slate-800 border border-slate-700/50 rounded-xl py-2.5 sm:py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-lg"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-500/10"
                    >
                        <Send size={18} />
                    </button>
                </form>
                <p className="text-[8px] sm:text-[9px] text-center mt-2 text-slate-600 uppercase tracking-widest font-mono">
                    Securely encrypted using AES-256-GCM
                </p>
            </div>
        </div>
    )
}
