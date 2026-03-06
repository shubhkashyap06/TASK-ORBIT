import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
    const { session, loading } = useAuth()

    if (loading) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at 50% 50%, #1d0b40 0%, #0f1a4a 50%, #050d25 100%)',
                fontFamily: 'Outfit, sans-serif',
                color: '#c4b5fd',
                fontSize: '18px',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(167,139,250,0.3)',
                        borderTop: '3px solid #a78bfa',
                        borderRadius: '50%',
                        animation: 'spinSlow 0.8s linear infinite',
                        margin: '0 auto 16px',
                    }} />
                    Loading...
                </div>
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    return children
}
