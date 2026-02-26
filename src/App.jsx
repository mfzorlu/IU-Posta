import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useMessaging } from './hooks/useMessaging'
import { AuthForm } from './components/AuthForm'
import { Sidebar } from './components/Sidebar'
import { ChatWindow } from './components/ChatWindow'
import { MemberList } from './components/MemberList'

function App() {
    const { user, profile, loading: authLoading, signIn, signUp, signOut, getPrivateKey } = useAuth()
    const [showMobileSidebar, setShowMobileSidebar] = useState(false)
    const {
        channels,
        activeChannel,
        messages,
        channelKey,
        createChannel,
        selectChannel,
        sendMessage,
        leaveChannel
    } = useMessaging(user, profile, getPrivateKey)

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
                <AuthForm onSignIn={signIn} onSignUp={signUp} />
            </div>
        )
    }

    return (
        <div className="h-screen w-full bg-slate-950 text-white flex overflow-hidden relative">
            <Sidebar
                channels={channels}
                activeChannel={activeChannel}
                onSelectChannel={(c) => {
                    selectChannel(c)
                    setShowMobileSidebar(false)
                }}
                onCreateChannel={createChannel}
                onSignOut={signOut}
                onLeave={leaveChannel}
                userProfile={profile}
                isOpen={showMobileSidebar}
                onClose={() => setShowMobileSidebar(false)}
            />

            <ChatWindow
                channel={activeChannel}
                messages={messages}
                onSendMessage={sendMessage}
                onToggleSidebar={() => setShowMobileSidebar(!showMobileSidebar)}
            />

            {activeChannel && (
                <div className="hidden lg:block">
                    <MemberList
                        channel={activeChannel}
                        channelKey={channelKey}
                        onLeave={leaveChannel}
                    />
                </div>
            )}
        </div>
    )
}

export default App
