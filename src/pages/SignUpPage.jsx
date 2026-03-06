import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Background from '../components/Background'

export default function SignUpPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const { signUp } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        const { data, error } = await signUp(email, password)
        setLoading(false)

        if (error) {
            setError(error.message)
        } else if (data?.user?.identities?.length === 0) {
            setError('An account with this email already exists')
        } else {
            setSuccess('Account created! Check your email for a confirmation link.')
        }
    }

    const inputStyle = {
        width: '100%',
        padding: '13px 16px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '12px',
        color: '#ffffff',
        fontSize: '15px',
        fontFamily: 'Outfit, sans-serif',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
    }

    const handleFocus = (e) => {
        e.target.style.borderColor = 'rgba(167,139,250,0.5)'
        e.target.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.15)'
    }
    const handleBlur = (e) => {
        e.target.style.borderColor = 'rgba(255,255,255,0.12)'
        e.target.style.boxShadow = 'none'
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Outfit, sans-serif',
            overflow: 'hidden',
        }}>
            <Background />

            <div style={{
                position: 'relative',
                zIndex: 10,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '24px',
                boxShadow: '0 8px 64px rgba(120,60,255,0.2), 0 2px 16px rgba(0,0,0,0.4)',
                padding: '48px 44px',
                width: 'min(420px, 90vw)',
            }}>
                <Link to="/" style={{
                    position: 'absolute',
                    top: '16px',
                    left: '20px',
                    color: 'rgba(196,181,253,0.7)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'color 0.2s',
                }}
                    onMouseEnter={e => e.target.style.color = '#c4b5fd'}
                    onMouseLeave={e => e.target.style.color = 'rgba(196,181,253,0.7)'}
                >
                    ← Back
                </Link>

                <h2 style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#ffffff',
                    textAlign: 'center',
                    marginBottom: '8px',
                    letterSpacing: '0.02em',
                }}>Create Account</h2>

                <p style={{
                    fontSize: '14px',
                    color: 'rgba(196,181,253,0.6)',
                    textAlign: 'center',
                    marginBottom: '32px',
                }}>Start managing your tasks today</p>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: '20px',
                        color: '#fca5a5',
                        fontSize: '13px',
                        textAlign: 'center',
                    }}>{error}</div>
                )}

                {success && (
                    <div style={{
                        background: 'rgba(34,197,94,0.15)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: '20px',
                        color: '#86efac',
                        fontSize: '13px',
                        textAlign: 'center',
                    }}>{success}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            color: 'rgba(196,181,253,0.7)',
                            marginBottom: '6px',
                            fontWeight: 500,
                        }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            color: 'rgba(196,181,253,0.7)',
                            marginBottom: '6px',
                            fontWeight: 500,
                        }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            color: 'rgba(196,181,253,0.7)',
                            marginBottom: '6px',
                            fontWeight: 500,
                        }}>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: loading
                                ? 'rgba(124,58,237,0.4)'
                                : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: 600,
                            fontFamily: 'Outfit, sans-serif',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 24px rgba(124,58,237,0.4)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={e => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(-1px)'
                                e.target.style.boxShadow = '0 6px 30px rgba(124,58,237,0.6)'
                            }
                        }}
                        onMouseLeave={e => {
                            e.target.style.transform = 'translateY(0)'
                            e.target.style.boxShadow = '0 4px 24px rgba(124,58,237,0.4)'
                        }}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{
                    textAlign: 'center',
                    marginTop: '28px',
                    fontSize: '14px',
                    color: 'rgba(196,181,253,0.5)',
                }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{
                        color: '#a78bfa',
                        textDecoration: 'none',
                        fontWeight: 600,
                        transition: 'color 0.2s',
                    }}
                        onMouseEnter={e => e.target.style.color = '#c4b5fd'}
                        onMouseLeave={e => e.target.style.color = '#a78bfa'}
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    )
}
