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

    // Fetch joined channels
    useEffect(() => {
        if (!user) return
        fetchChannels()
    }, [user])

    // Realtime subscription for new messages
    useEffect(() => {
        if (!activeChannel) return

        const channel = supabase
            .channel(`room:${activeChannel.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `channel_id=eq.${activeChannel.id}`
            }, async (payload) => {
                const newMessage = await decryptIncomingMessage(payload.new)
                setMessages((prev) => [...prev, newMessage])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [activeChannel, channelKey])

    const fetchChannels = async () => {
        const { data, error } = await supabase
            .from('channels')
            .select('*, channel_members!inner(user_id)')
            .eq('channel_members.user_id', user.id)

        if (data) setChannels(data)
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

        // Fetch and Decrypt Channel Key
        const { data, error } = await supabase
            .from('channel_keys')
            .select('encrypted_channel_key')
            .eq('channel_id', channel.id)
            .eq('user_id', user.id)
            .single()

        if (data && privateKey) {
            const decryptedKey = await decryptAESKeyWithRSA(data.encrypted_channel_key, privateKey)
            setChannelKey(decryptedKey)

            // Fetch existing messages
            const { data: msgs } = await supabase
                .from('messages')
                .select('*, users:sender_id(display_name)')
                .eq('channel_id', channel.id)
                .order('created_at', { ascending: true })

            const decryptedMessages = await Promise.all((msgs || []).map(m => decryptIncomingMessage(m, decryptedKey)))
            setMessages(decryptedMessages)
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

    const decryptIncomingMessage = async (msg, key = channelKey) => {
        if (!key) return { ...msg, content: '[Key Missing]' }

        // If msg doesn't have users, fetch it (for realtime)
        let displayName = msg.users?.display_name
        if (!displayName) {
            const { data } = await supabase.from('users').select('display_name').eq('id', msg.sender_id).single()
            displayName = data?.display_name || 'Unknown'
        }

        const decrypted = await decryptMessage(msg.encrypted_content, msg.iv, key)
        return {
            ...msg,
            content: decrypted,
            sender_name: displayName
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
        sendMessage
    }
}
