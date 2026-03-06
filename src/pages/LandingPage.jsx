import React, { useState, useEffect, useCallback } from 'react'
import Background from '../components/Background'
import Character from '../components/Character'
import GlassCard from '../components/GlassCard'

/* -------------------------------------------------------
 * Character configurations
 * top/left/right/bottom values position the character;
 * negative values to let them "peek in" from the edge.
 * ------------------------------------------------------- */
const CHARACTERS = [
    {
        id: 'circle',
        type: 'circle',
        color: '#FF5FA2',
        size: 155,
        style: { top: '-30px', left: '-30px' },
        mobileStyle: { top: '-20px', left: '-20px' },
        eyes: [
            { cx: 58, cy: 62, r: 20 },
            { cx: 98, cy: 55, r: 18 },
        ],
        floatDuration: '4.2s',
        floatDelay: '0s',
        floatReverse: false,
    },
    {
        id: 'flower',
        type: 'flower',
        color: '#FF8C00',
        size: 165,
        style: { top: '-35px', right: '-35px', left: 'auto' },
        mobileStyle: { top: '-25px', right: '-25px', left: 'auto' },
        eyes: [
            { cx: 55, cy: 70, r: 16 },
            { cx: 85, cy: 70, r: 16 },
        ],
        floatDuration: '5s',
        floatDelay: '0.8s',
        floatReverse: true,
    },
    {
        id: 'triangle',
        type: 'triangle',
        color: '#1a3a6e',
        size: 160,
        style: { bottom: '-30px', left: '-30px', top: 'auto' },
        mobileStyle: { bottom: '-15px', left: '-15px', top: 'auto' },
        eyes: [
            { cx: 45, cy: 95, r: 16 },
            { cx: 80, cy: 95, r: 16 },
        ],
        floatDuration: '4.6s',
        floatDelay: '1.2s',
        floatReverse: false,
    },
    {
        id: 'smiley',
        type: 'smiley',
        color: '#FFD000',
        size: 155,
        style: {
            bottom: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            top: 'auto',
        },
        mobileStyle: {
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            top: 'auto',
        },
        eyes: [
            { cx: 48, cy: 60, r: 18 },
            { cx: 92, cy: 60, r: 18 },
        ],
        floatDuration: '3.8s',
        floatDelay: '0.4s',
        floatReverse: true,
    },
    {
        id: 'blob',
        type: 'blob',
        color: '#00C9A7',
        size: 145,
        style: { bottom: '-25px', right: '-25px', left: 'auto', top: 'auto' },
        mobileStyle: { bottom: '-15px', right: '-15px', left: 'auto', top: 'auto' },
        eyes: [
            { cx: 58, cy: 62, r: 19 },
            { cx: 95, cy: 65, r: 16 },
        ],
        floatDuration: '5.2s',
        floatDelay: '2s',
        floatReverse: false,
    },
]

/* -------------------------------------------------------
 * Decorative edge mid-screen accents (left + right sides)
 * ------------------------------------------------------- */
const ACCENT_CHARS = [
    {
        id: 'left-mid',
        type: 'blob',
        color: '#6c3bbd',
        size: 90,
        style: { top: '40%', left: '-18px', transform: 'translateY(-50%)', opacity: 0.7 },
        mobileStyle: { display: 'none' },
        eyes: [{ cx: 70, cy: 65, r: 14 }],
        floatDuration: '6s',
        floatDelay: '1s',
    },
    {
        id: 'right-mid',
        type: 'circle',
        color: '#2563eb',
        size: 82,
        style: { top: '35%', right: '-12px', left: 'auto', transform: 'translateY(-50%)', opacity: 0.65 },
        mobileStyle: { display: 'none' },
        eyes: [{ cx: 68, cy: 68, r: 13 }],
        floatDuration: '5.5s',
        floatDelay: '0.6s',
    },
]

export default function LandingPage() {
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
    const [isMobile, setIsMobile] = useState(false)

    // Track window size
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    // Mouse + touch tracking
    const handleMouseMove = useCallback((e) => {
        setCursorPos({ x: e.clientX, y: e.clientY })
    }, [])

    const handleTouchMove = useCallback((e) => {
        const touch = e.touches[0]
        if (touch) setCursorPos({ x: touch.clientX, y: touch.clientY })
    }, [])

    // When touch ends, return eyes to center
    const handleTouchEnd = useCallback(() => {
        setCursorPos({ x: -1, y: -1 })
    }, [])

    // When mouse leaves window, return eyes to center
    const handleMouseLeave = useCallback(() => {
        setCursorPos({ x: -1, y: -1 })
    }, [])

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseleave', handleMouseLeave)
        window.addEventListener('touchmove', handleTouchMove, { passive: true })
        window.addEventListener('touchend', handleTouchEnd, { passive: true })
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseleave', handleMouseLeave)
            window.removeEventListener('touchmove', handleTouchMove)
            window.removeEventListener('touchend', handleTouchEnd)
        }
    }, [handleMouseMove, handleMouseLeave, handleTouchMove, handleTouchEnd])

    const allChars = [...CHARACTERS, ...ACCENT_CHARS]

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            overflow: 'hidden',
            fontFamily: 'Outfit, sans-serif',
        }}>
            {/* Gradient background + sparkles */}
            <Background />

            {/* Characters */}
            {allChars.map((char) => {
                const appliedStyle = isMobile
                    ? { ...char.style, ...char.mobileStyle }
                    : char.style

                if (appliedStyle?.display === 'none') return null

                return (
                    <Character
                        key={char.id}
                        type={char.type}
                        color={char.color}
                        size={isMobile ? Math.round(char.size * 0.72) : char.size}
                        eyes={char.eyes}
                        cursorPos={cursorPos}
                        style={appliedStyle}
                        floatDuration={char.floatDuration}
                        floatDelay={char.floatDelay}
                        floatReverse={char.floatReverse}
                    />
                )
            })}

            {/* Center glassmorphism card */}
            <GlassCard />
        </div>
    )
}
