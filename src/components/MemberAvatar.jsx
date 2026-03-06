import React from 'react'
import { useTheme } from '../context/ThemeContext'

const COLORS = [
    '#7c3aed', '#2563eb', '#0891b2', '#059669', '#ca8a04',
    '#dc2626', '#db2777', '#9333ea', '#4f46e5', '#0d9488',
]

function getColor(str) {
    if (!str) return COLORS[0]
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
    return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name, email) {
    if (name && name.trim()) {
        const parts = name.trim().split(/\s+/)
        return parts.length > 1
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase()
    }
    if (email) return email.slice(0, 2).toUpperCase()
    return '??'
}

export default function MemberAvatar({ name, email, avatarUrl, size = 28, style = {}, showTooltip = true }) {
    const { theme } = useTheme()
    const initials = getInitials(name, email)
    const bgColor = getColor(email || name)

    return (
        <div
            title={showTooltip ? (name || email || 'Unknown') : undefined}
            style={{
                width: size, height: size, borderRadius: '50%',
                background: avatarUrl ? `url(${avatarUrl}) center/cover` : bgColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: size * 0.38, fontWeight: 700, color: '#fff',
                flexShrink: 0, border: `2px solid ${theme.bg}`,
                cursor: 'default', ...style,
            }}
        >
            {!avatarUrl && initials}
        </div>
    )
}

export function MemberAvatarStack({ members = [], max = 3, size = 26, style = {} }) {
    const shown = members.slice(0, max)
    const extra = members.length - max

    return (
        <div style={{ display: 'flex', alignItems: 'center', ...style }}>
            {shown.map((m, i) => (
                <MemberAvatar
                    key={m.userId || m.id || i}
                    name={m.display_name}
                    email={m.email}
                    avatarUrl={m.avatar_url}
                    size={size}
                    style={{ marginLeft: i > 0 ? -8 : 0, zIndex: max - i }}
                />
            ))}
            {extra > 0 && (
                <div style={{
                    width: size, height: size, borderRadius: '50%',
                    background: 'rgba(124,58,237,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: size * 0.36, fontWeight: 700, color: '#c4b5fd',
                    marginLeft: -8, zIndex: 0,
                }}>+{extra}</div>
            )}
        </div>
    )
}
