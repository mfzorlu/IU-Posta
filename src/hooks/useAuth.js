import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import { generateRSAKeyPair } from '../lib/crypto'

export const useAuth = () => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            else setProfile(null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (data) setProfile(data)
    }

    const signUp = async (email, password, displayName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                },
            },
        })

        if (error) throw error

        // Generate E2EE Keys
        const { publicKey, privateKey } = await generateRSAKeyPair()

        // Store Private Key in LocalStorage
        localStorage.setItem(`iu_posta_priv_${data.user.id}`, privateKey)

        // Store Public Key and Profile in DB
        const { error: profileError } = await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email,
            display_name: displayName,
            public_key: publicKey,
        })

        if (profileError) throw profileError
        return data
    }

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        return data
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    const getPrivateKey = () => {
        if (!user) return null
        return localStorage.getItem(`iu_posta_priv_${user.id}`)
    }

    return {
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        getPrivateKey,
    }
}
