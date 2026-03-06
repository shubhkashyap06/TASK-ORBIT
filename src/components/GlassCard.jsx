import React from 'react'
import { Link } from 'react-router-dom'

export default function GlassCard() {
    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,

            /* No glass — fully transparent container */
            background: 'transparent',
            border: 'none',
            borderRadius: '0',
            boxShadow: 'none',

            padding: 'clamp(32px, 5vw, 60px) clamp(40px, 7vw, 80px)',
            textAlign: 'center',
            maxWidth: 'min(720px, 92vw)',
            width: '100%',
        }}>

            {/* Main Title */}
            <h1 style={{
                fontSize: 'clamp(26px, 4.8vw, 50px)',
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: '22px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'linear-gradient(135deg, #ffffff 0%, #d8b4fe 40%, #60efff 70%, #ffffff 100%)',
                backgroundSize: '300% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 5s linear infinite',
                filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.45)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
            }}>
                TaskOrbit
            </h1>

            {/* Subtitle */}
            <p style={{
                fontSize: 'clamp(14px, 2.2vw, 20px)',
                color: 'rgba(220,215,255,0.8)',
                fontWeight: 400,
                lineHeight: 1.6,
                marginBottom: '14px',
                letterSpacing: '0.02em',
                fontStyle: 'italic',
            }}>
                Stay Organized. Stay Focused. Keep Growing.
            </p>

            {/* Author */}
            <p style={{
                fontSize: 'clamp(11px, 1.5vw, 14px)',
                color: 'rgba(180,175,210,0.5)',
                fontWeight: 300,
                letterSpacing: '0.06em',
                marginBottom: '32px',
            }}>
                By Shubh Kashyap
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                    <button style={{
                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '100px',
                        padding: '13px 36px',
                        fontSize: 'clamp(13px, 1.8vw, 16px)',
                        fontWeight: 600,
                        fontFamily: 'Outfit, sans-serif',
                        cursor: 'pointer',
                        letterSpacing: '0.03em',
                        boxShadow: '0 4px 24px rgba(124,58,237,0.5)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)'
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.7)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,58,237,0.5)'
                        }}
                    >
                        Get Started →
                    </button>
                </Link>

                <Link to="/signup" style={{ textDecoration: 'none' }}>
                    <button style={{
                        background: 'transparent',
                        color: '#c4b5fd',
                        border: '1px solid rgba(167,139,250,0.4)',
                        borderRadius: '100px',
                        padding: '13px 36px',
                        fontSize: 'clamp(13px, 1.8vw, 16px)',
                        fontWeight: 600,
                        fontFamily: 'Outfit, sans-serif',
                        cursor: 'pointer',
                        letterSpacing: '0.03em',
                        transition: 'transform 0.2s ease, background 0.2s, border-color 0.2s',
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.background = 'rgba(167,139,250,0.12)'
                            e.currentTarget.style.borderColor = 'rgba(167,139,250,0.6)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'
                        }}
                    >
                        Sign Up
                    </button>
                </Link>
            </div>
        </div>
    )
}
