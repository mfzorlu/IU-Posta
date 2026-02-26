import React, { useState } from 'react'
import { Hash, Plus, Settings, LogOut, X } from 'lucide-react'

export function Sidebar({ channels, activeChannel, onSelectChannel, onCreateChannel, onSignOut, onLeave, userProfile, isOpen, onClose }) {
    const [isCreating, setIsCreating] = useState(false)
    const [newChannelName, setNewChannelName] = useState('')

    const handleCreate = (e) => {
        e.preventDefault()
        if (newChannelName.trim()) {
            onCreateChannel(newChannelName)
            setNewChannelName('')
            setIsCreating(false)
        }
    }

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full 
        transition-transform duration-300 md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="font-bold text-lg tracking-tight">IU Posta</h1>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Channels List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <div className="flex items-center justify-between px-2 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                        <span>Channels</span>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="hover:text-blue-400 transition-colors"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {isCreating && (
                        <form onSubmit={handleCreate} className="px-2 mb-2">
                            <input
                                autoFocus
                                type="text"
                                placeholder="channel-name"
                                className="w-full bg-slate-800 border border-blue-500/50 rounded p-1.5 text-sm focus:outline-none"
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                onBlur={() => !newChannelName && setIsCreating(false)}
                            />
                        </form>
                    )}

                    {channels.map((channel) => (
                        <div
                            key={channel.id}
                            onClick={() => onSelectChannel(channel)}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-all group cursor-pointer ${activeChannel?.id === channel.id
                                ? 'bg-blue-600/20 text-blue-400 font-medium'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Hash size={18} />
                                <span className="truncate">{channel.name}</span>
                            </div>

                            {activeChannel?.id === channel.id && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (window.confirm(`Are you sure you want to leave #${channel.name}?`)) {
                                            onLeave(channel.id)
                                        }
                                    }}
                                    className="p-1 rounded hover:bg-red-500 hover:text-white text-slate-500 transition-colors md:hidden"
                                    title="Leave Channel"
                                >
                                    <LogOut size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* User Footer */}
                <div className="p-4 bg-slate-950/50 border-t border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                            {userProfile?.display_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{userProfile?.display_name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Verified Student</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onSignOut}
                            className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                        >
                            <LogOut size={14} />
                            Sign Out
                        </button>
                        <button className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                            <Settings size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
