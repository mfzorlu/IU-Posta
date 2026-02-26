import React, { useState } from 'react'
import { UserPlus, Search, UserCheck, Shield, LogOut } from 'lucide-react'
import { supabase } from '../api/supabase'
import { encryptAESKeyWithRSA } from '../lib/crypto'

export function MemberList({ channel, channelKey, onMemberAdded, onLeave }) {
    const [searchEmail, setSearchEmail] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(false)

    React.useEffect(() => {
        if (channel) fetchMembers()
    }, [channel])

    const fetchMembers = async () => {
        const { data } = await supabase
            .from('channel_members')
            .select('user_id, users:user_id(id, display_name, email)')
            .eq('channel_id', channel.id)
        if (data) setMembers(data.map(m => m.users))
    }

    const handleSearch = async (e) => {
        e.preventDefault()
        if (searchEmail.length < 3) return

        setLoading(true)
        const { data } = await supabase
            .from('users')
            .select('id, email, display_name, public_key')
            .ilike('email', `%${searchEmail}%`)
            .limit(5)

        setSearchResults(data || [])
        setLoading(false)
    }

    const inviteUser = async (user) => {
        setLoading(true)
        try {
            // 1. Add to channel_members
            await supabase.from('channel_members').insert({
                channel_id: channel.id,
                user_id: user.id
            })

            // 2. Encrypt channel key for the new user
            const encryptedKey = await encryptAESKeyWithRSA(channelKey, user.public_key)

            // 3. Store in channel_keys
            await supabase.from('channel_keys').insert({
                channel_id: channel.id,
                user_id: user.id,
                encrypted_channel_key: encryptedKey
            })

            fetchMembers()
            setSearchResults([])
            setSearchEmail('')
            if (onMemberAdded) onMemberAdded()
        } catch (error) {
            console.error('Invite failed:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col h-full">
            <div className="p-4 border-b border-slate-800">
                <h3 className="font-bold text-sm flex items-center gap-2">
                    <Shield size={16} className="text-blue-400" />
                    Members
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Search / Invite */}
                <div className="space-y-2">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-2 top-2 text-slate-500" size={14} />
                        <input
                            type="text"
                            placeholder="Invite by email..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-md py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:border-blue-500/50"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                        />
                    </form>

                    {searchResults.length > 0 && (
                        <div className="bg-slate-800 border border-slate-700 rounded-md overflow-hidden shadow-xl">
                            {searchResults.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => inviteUser(u)}
                                    disabled={members.some(m => m.email === u.email)}
                                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-700 flex items-center justify-between group"
                                >
                                    <span className="truncate">{u.display_name}</span>
                                    {members.some(m => m.email === u.email) ? (
                                        <UserCheck size={12} className="text-green-500" />
                                    ) : (
                                        <UserPlus size={12} className="text-blue-500 opacity-0 group-hover:opacity-100" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Member List */}
                <div className="space-y-2">
                    {members.map((member, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-400 group">
                            <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                {member.display_name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate flex-1">{member.display_name}</span>
                            {member.id === channel.created_by && (
                                <span className="text-[8px] px-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-tighter">Owner</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Leave Channel Button */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={() => {
                        if (window.confirm(`Are you sure you want to leave #${channel.name}?`)) {
                            onLeave(channel.id)
                        }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all text-xs font-semibold border border-red-500/20"
                >
                    <LogOut size={14} />
                    Leave Channel
                </button>
            </div>
        </div>
    )
}
