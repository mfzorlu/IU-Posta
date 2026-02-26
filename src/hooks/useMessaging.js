import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import {
    generateAESKey,
    encryptAESKeyWithRSA,
    decryptAESKeyWithRSA,
    encryptMessage,
    decryptMessage
} from '../lib/crypto'

export const useMessaging = (user, profile, privateKey) => {
    const [channels, setChannels] = useState([])
    const [activeChannel, setActiveChannel] = useState(null)
    const [messages, setMessages] = useState([])
    const [channelKey, setChannelKey] = useState(null)
    const [loading, setLoading] = useState(false)

    // 1. Fetch joined channels on login
    useEffect(() => {
        if (!user) return
        fetchChannels()
    }, [user])

    // 2. Persistence: Save active channel to localStorage
    useEffect(() => {
        if (activeChannel) {
            localStorage.setItem('iu_posta_active_channel', JSON.stringify(activeChannel))
        }
    }, [activeChannel])

    // 3. Auto-select on mount (after channels loaded)
    useEffect(() => {
        if (channels.length > 0 && !activeChannel) {
            const saved = localStorage.getItem('iu_posta_active_channel')
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    const stillExists = channels.find(c => c.id === parsed.id)
                    if (stillExists) selectChannel(stillExists)
                } catch (e) {
                    localStorage.removeItem('iu_posta_active_channel')
                }
            }
        }
    }, [channels])

    // 4. Trigger message fetch when activeChannel and channelKey are both ready
    useEffect(() => {
        if (activeChannel && channelKey) {
            fetchMessages()
        }
    }, [activeChannel, channelKey])

    // 5. Realtime subscription for incoming messages
    useEffect(() => {
        if (!activeChannel || !channelKey) return

        const channel = supabase
            .channel(`room:${activeChannel.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `channel_id=eq.${activeChannel.id}`
            }, async (payload) => {
                const newMessage = await decryptIncomingMessage(payload.new)
                setMessages((prev) => {
                    // Prevent duplicate messages (realtime might fire for own message)
                    if (prev.some(m => m.id === newMessage.id)) return prev
                    return [...prev, newMessage]
                })
            })
            .subscribe()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [activeChannel, channelKey])

    const fetchChannels = async () => {
        const { data, error } = await supabase
            .from('channels')
            .select('*, channel_members!inner(user_id)')
            .eq('channel_members.user_id', user.id)

        if (data) setChannels(data)
    }

    const fetchMessages = async () => {
        if (!activeChannel || !channelKey) return

        const { data: msgs } = await supabase
            .from('messages')
            .select('*, users:sender_id(display_name)')
            .eq('channel_id', activeChannel.id)
            .order('created_at', { ascending: true })

        if (msgs) {
            const decryptedMessages = await Promise.all(msgs.map(m => decryptIncomingMessage(m, channelKey)))
            setMessages(decryptedMessages)
        }
    }

    const createChannel = async (name) => {
        setLoading(true)
        try {
            // 1. Create Channel
            const { data: channel, error } = await supabase
                .from('channels')
                .insert({ name, created_by: user.id })
                .select()
                .single()
            if (error) throw error

            // 2. Add creator as member
            await supabase.from('channel_members').insert({ channel_id: channel.id, user_id: user.id })

            // 3. Generate Channel AES Key
            const aesKey = await generateAESKey()

            // 4. Encrypt AES Key for self using RSA Public Key
            const encryptedKey = await encryptAESKeyWithRSA(aesKey, profile.public_key)

            // 5. Store Encrypted Key
            await supabase.from('channel_keys').insert({
                channel_id: channel.id,
                user_id: user.id,
                encrypted_channel_key: encryptedKey
            })

            fetchChannels()
            return channel
        } finally {
            setLoading(false)
        }
    }

    const selectChannel = async (channel) => {
        setActiveChannel(channel)
        setMessages([])
        setChannelKey(null)

        const fetchKey = async (retry = true) => {
            const { data, error, status } = await supabase
                .from('channel_keys')
                .select('encrypted_channel_key')
                .eq('channel_id', channel.id)
                .eq('user_id', user.id)
                .maybeSingle()

            if ((!data || error) && retry) {
                console.warn('Channel key fetch failed, retrying in 500ms...', { error, status })
                await new Promise(r => setTimeout(r, 500))
                return fetchKey(false)
            }
            return data
        }

        const data = await fetchKey()

        if (data && privateKey) {
            try {
                const decryptedKey = await decryptAESKeyWithRSA(data.encrypted_channel_key, privateKey)
                setChannelKey(decryptedKey)
            } catch (err) {
                console.error('Failed to decrypt channel key:', err)
            }
        }
    }

    const sendMessage = async (content) => {
        if (!activeChannel || !channelKey) return

        const { ciphertext, iv } = await encryptMessage(content, channelKey)

        const { error } = await supabase.from('messages').insert({
            channel_id: activeChannel.id,
            sender_id: user.id,
            encrypted_content: ciphertext,
            iv: iv
        })

        if (error) throw error
    }

    const leaveChannel = async (channelId) => {
        try {
            // 1. Check member count
            const { data: members } = await supabase
                .from('channel_members')
                .select('user_id')
                .eq('channel_id', channelId)

            const isLastMember = members?.length === 1
            const isCreator = activeChannel?.created_by === user.id

            // 2. Delete member and keys
            await supabase.from('channel_members').delete().eq('channel_id', channelId).eq('user_id', user.id)
            await supabase.from('channel_keys').delete().eq('channel_id', channelId).eq('user_id', user.id)

            // 3. If last member and creator, delete channel
            if (isLastMember && isCreator) {
                await supabase.from('channels').delete().eq('id', channelId)
            }

            setActiveChannel(null)
            fetchChannels()
        } catch (error) {
            console.error('Failed to leave channel:', error)
            throw error
        }
    }

    const decryptIncomingMessage = async (msg, key = channelKey) => {
        if (!key) return { ...msg, content: '[Key Missing]', sender_name: '???' }

        try {
            // If msg doesn't have users, fetch it (for realtime)
            let displayName = msg.users?.display_name || msg.sender_name
            if (!displayName) {
                const { data } = await supabase.from('users').select('display_name').eq('id', msg.sender_id).maybeSingle()
                displayName = data?.display_name || 'Unknown student'
            }

            const decrypted = await decryptMessage(msg.encrypted_content, msg.iv, key)
            return {
                ...msg,
                content: decrypted,
                sender_name: displayName
            }
        } catch (error) {
            console.error('Decryption failed for message:', error)
            return { ...msg, content: '[Decryption Error]', sender_name: '???' }
        }
    }

    return {
        channels,
        activeChannel,
        messages,
        channelKey,
        loading,
        createChannel,
        selectChannel,
        sendMessage,
        leaveChannel
    }
}
