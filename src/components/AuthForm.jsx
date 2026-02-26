import React, { useState } from 'react'
import { Mail, Lock, User, LifeBuoy } from 'lucide-react'

export function AuthForm({ onSignIn, onSignUp }) {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (isLogin) {
                await onSignIn(email, password)
            } else {
                await onSignUp(email, password, displayName)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl shadow-2xl">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 mb-4 border border-blue-500/20">
                    <LifeBuoy size={32} />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Join IU Posta'}
                </h2>
                <p className="text-slate-400 mt-2">
                    {isLogin ? 'Sign in to your secure account' : 'Created for Istanbul University Students'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Display Name"
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                        />
                    </div>
                )}
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-500" size={20} />
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-500" size={20} />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                </button>
            </form>

            <div className="mt-8 text-center text-slate-400 text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4"
                >
                    {isLogin ? 'Sign Up' : 'Log In'}
                </button>
            </div>

            {!isLogin && (
                <div className="mt-6 pt-6 border-t border-slate-800 text-[10px] text-center text-slate-500 uppercase tracking-widest">
                    End-to-End Encrypted &bull; User Privacy First
                </div>
            )}
        </div>
    )
}
