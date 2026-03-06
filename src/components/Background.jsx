import React, { useRef, useEffect } from 'react'

const SPARKLE_COUNT = 30

const getRandomSparkles = () =>
    Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
        id: i,
        top: `${Math.random() * 95}%`,
        left: `${Math.random() * 95}%`,
        size: Math.random() * 10 + 6,
        delay: `${Math.random() * 5}s`,
        duration: `${Math.random() * 3 + 2}s`,
        color: Math.random() > 0.5 ? '#a78bfa' : Math.random() > 0.5 ? '#60efff' : '#ffd060',
        shape: Math.random() > 0.5 ? 'star4' : 'dot',
    }))

const sparkles = getRandomSparkles()

function Sparkle({ top, left, size, delay, duration, color, shape }) {
    const style = {
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        animationDelay: delay,
        animationDuration: duration,
        animation: `twinkle ${duration} ${delay} ease-in-out infinite`,
        pointerEvents: 'none',
    }

    if (shape === 'dot') {
        return (
            <div style={{
                ...style,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 ${size * 1.5}px ${color}`,
            }} />
        )
    }

    // 4-pointed star via SVG
    return (
        <svg style={style} viewBox="0 0 20 20" fill="none">
            <path
                d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z"
                fill={color}
                filter={`drop-shadow(0 0 3px ${color})`}
            />
        </svg>
    )
}

export default function Background() {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, #1d0b40 0%, #0f1a4a 50%, #050d25 100%)',
            overflow: 'hidden',
            zIndex: 0,
        }}>
            {/* Soft radial glow */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '55vw',
                height: '55vh',
                background: 'radial-gradient(ellipse, rgba(120,60,255,0.22) 0%, rgba(60,120,255,0.10) 50%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Secondary teal glow */}
            <div style={{
                position: 'absolute',
                top: '65%',
                left: '30%',
                width: '30vw',
                height: '30vh',
                background: 'radial-gradient(ellipse, rgba(60,230,200,0.10) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Sparkles */}
            {sparkles.map(s => <Sparkle key={s.id} {...s} />)}
        </div>
    )
}
