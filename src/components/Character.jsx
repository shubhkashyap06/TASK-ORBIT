import React, { useRef, useEffect, useCallback, useState } from 'react'

/* --------------------------------------------------
 * Character SVG body definitions
 * -------------------------------------------------- */

function CircleBody({ color = '#FF5FA2' }) {
    return (
        <g>
            <circle cx="70" cy="70" r="70" fill={color} />
            <ellipse cx="40" cy="40" rx="18" ry="14" fill="rgba(255,255,255,0.18)" transform="rotate(-30,40,40)" />
        </g>
    )
}

function FlowerBody({ color = '#FF8C00' }) {
    const petals = Array.from({ length: 6 }, (_, i) => {
        const angle = (i * 60 * Math.PI) / 180
        const cx = 70 + Math.cos(angle) * 38
        const cy = 70 + Math.sin(angle) * 38
        return <ellipse key={i} cx={cx} cy={cy} rx="22" ry="18" fill={color} transform={`rotate(${i * 60},${cx},${cy})`} />
    })
    return (
        <g>
            {petals}
            <circle cx="70" cy="70" r="40" fill={color} />
            <ellipse cx="55" cy="55" rx="10" ry="7" fill="rgba(255,255,255,0.2)" transform="rotate(-30,55,55)" />
        </g>
    )
}

function TriangleBody({ color = '#1B3A6B' }) {
    return (
        <g>
            <polygon points="0,130 65,0 130,130" fill={color} />
            <polygon points="0,130 65,0 130,130" fill="rgba(255,255,255,0.05)" />
            <ellipse cx="40" cy="100" rx="14" ry="10" fill="rgba(255,255,255,0.1)" />
        </g>
    )
}

function SmileyBody({ color = '#FFD000' }) {
    return (
        <g>
            <circle cx="70" cy="70" r="70" fill={color} />
            <path d="M 45 95 Q 70 115 95 95" stroke="#3a2000" strokeWidth="5" fill="none" strokeLinecap="round" />
            <ellipse cx="40" cy="38" rx="15" ry="10" fill="rgba(255,255,255,0.22)" transform="rotate(-35,40,38)" />
        </g>
    )
}

function BlobBody({ color = '#00C9A7' }) {
    return (
        <g>
            <ellipse cx="68" cy="72" rx="64" ry="60" fill={color} />
            <path d="M 20 40 Q 68 10 116 40 Q 132 72 116 104 Q 68 134 20 104 Q 4 72 20 40 Z" fill={color} />
            <ellipse cx="38" cy="38" rx="14" ry="9" fill="rgba(255,255,255,0.2)" transform="rotate(-35,38,38)" />
            <path d="M 50 95 Q 68 108 86 95" stroke="#005c4b" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
    )
}

const CHARACTER_BODIES = {
    circle: CircleBody,
    flower: FlowerBody,
    triangle: TriangleBody,
    smiley: SmileyBody,
    blob: BlobBody,
}

/* --------------------------------------------------
 * Eye component — mouse + touch cursor tracking
 * -------------------------------------------------- */
function Eye({ cx, cy, r, cursorPos, domRef }) {
    const pupilRef = useRef(null)
    const currentOffset = useRef({ x: 0, y: 0 })
    const targetOffset = useRef({ x: 0, y: 0 })
    const rafId = useRef(null)
    const maxOffset = r * 0.55
    const LERP_SPEED = 0.18
    const SENSITIVITY_DIST = 120

    useEffect(() => {
        if (!domRef?.current) return
        const svgEl = domRef.current.querySelector('svg')
        if (!svgEl) return

        const rect = svgEl.getBoundingClientRect()
        const svgCx = rect.left + (cx / 140) * rect.width
        const svgCy = rect.top + (cy / 140) * rect.height

        const dx = cursorPos.x - svgCx
        const dy = cursorPos.y - svgCy
        const angle = Math.atan2(dy, dx)
        const rawDist = Math.sqrt(dx * dx + dy * dy)

        // Return to center if no position set
        if (cursorPos.x === -1 && cursorPos.y === -1) {
            targetOffset.current = { x: 0, y: 0 }
            return
        }

        const t = Math.min(rawDist / SENSITIVITY_DIST, 1)
        const easedT = 1 - Math.pow(1 - t, 2.5)
        const offset = easedT * maxOffset

        targetOffset.current = {
            x: Math.cos(angle) * offset,
            y: Math.sin(angle) * offset,
        }
    }, [cursorPos, cx, cy, maxOffset])

    useEffect(() => {
        function animate() {
            const cur = currentOffset.current
            const tgt = targetOffset.current

            cur.x += (tgt.x - cur.x) * LERP_SPEED
            cur.y += (tgt.y - cur.y) * LERP_SPEED

            if (pupilRef.current) {
                pupilRef.current.style.transform = `translate(${cur.x}px, ${cur.y}px)`
            }

            rafId.current = requestAnimationFrame(animate)
        }
        rafId.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(rafId.current)
    }, [])

    return (
        <g>
            <circle cx={cx} cy={cy} r={r} fill="white" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
            <g ref={pupilRef}>
                <circle cx={cx} cy={cy} r={r * 0.52} fill="#1a1a2e" />
                <circle cx={cx - r * 0.18} cy={cy - r * 0.2} r={r * 0.17} fill="white" opacity="0.9" />
            </g>
        </g>
    )
}

/* --------------------------------------------------
 * Main Character component
 * -------------------------------------------------- */
export default function Character({
    type = 'circle',
    color,
    cursorPos,
    style = {},
    size = 140,
    eyes = [],
    floatDuration = '4s',
    floatDelay = '0s',
    floatReverse = false,
}) {
    const containerRef = useRef(null)
    const BodyComp = CHARACTER_BODIES[type] || CircleBody

    const floatAnim = floatReverse
        ? `floatReverse ${floatDuration} ${floatDelay} ease-in-out infinite`
        : `float ${floatDuration} ${floatDelay} ease-in-out infinite`

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                width: size,
                height: size,
                animation: floatAnim,
                zIndex: 2,
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.35))',
                ...style,
            }}
        >
            <svg
                viewBox="0 0 140 140"
                width={size}
                height={size}
                overflow="visible"
                style={{ display: 'block' }}
            >
                <BodyComp color={color} />
                {eyes.map((eye, i) => (
                    <Eye
                        key={i}
                        cx={eye.cx}
                        cy={eye.cy}
                        r={eye.r}
                        cursorPos={cursorPos}
                        domRef={containerRef}
                    />
                ))}
            </svg>
        </div>
    )
}
