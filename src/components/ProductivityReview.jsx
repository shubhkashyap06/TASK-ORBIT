import React, { useState } from 'react'
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { useProductivityStats } from '../hooks/useProductivityStats'

/* ─── tiny helpers ─── */
const PRIORITY_FILL = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' }
const STATUS_FILL = ['#a78bfa', '#60a5fa', '#34d399']

function StatCard({ emoji, label, value, sub, color, theme }) {
    return (
        <div style={{
            background: theme.bgCard, border: `1px solid ${theme.border}`,
            borderRadius: '12px', padding: '14px 16px', flex: '1 1 130px',
        }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{emoji}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: color || theme.text, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: theme.textSecondary, marginTop: '3px' }}>{label}</div>
            {sub && <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>{sub}</div>}
        </div>
    )
}

function SectionTitle({ children, theme }) {
    return (
        <div style={{ fontSize: '13px', fontWeight: 800, color: theme.text, margin: '18px 0 10px', letterSpacing: '0.03em' }}>
            {children}
        </div>
    )
}

function ScoreRing({ score, theme }) {
    const pct = Math.min(100, score)
    const color = score >= 75 ? '#34d399' : score >= 50 ? '#f59e0b' : '#ef4444'
    const r = 36, circ = 2 * Math.PI * r
    const offset = circ - (pct / 100) * circ
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r={r} fill="none" stroke={theme.bgInput} strokeWidth="8" />
                <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '44px 44px', transition: 'stroke-dashoffset 0.8s ease' }}
                />
                <text x="44" y="49" textAnchor="middle" fill={color}
                    fontSize="20" fontWeight="800" fontFamily="Outfit, sans-serif">{score}</text>
            </svg>
            <div style={{ fontSize: '10px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</div>
        </div>
    )
}

const CustomTooltip = ({ active, payload, label, theme }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: theme.text, fontFamily: 'Outfit' }}>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>
            ))}
        </div>
    )
}

/* ─── WEEKLY TAB ─── */
function WeeklyView({ stats, theme, isMobile }) {
    const { weekly } = stats
    const pctColor = weekly.pctChange >= 0 ? '#34d399' : '#ef4444'
    const pctLabel = weekly.pctChange >= 0 ? `↑ ${weekly.pctChange}%` : `↓ ${Math.abs(weekly.pctChange)}%`

    return (
        <div>
            {/* Motivation banner */}
            <div style={{
                background: `linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))`,
                border: `1px solid ${theme.border}`, borderRadius: '12px',
                padding: '14px 16px', marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
            }}>
                <ScoreRing score={weekly.score} theme={theme} />
                <div style={{ flex: 1, minWidth: '180px' }}>
                    <div style={{ fontSize: '13px', color: theme.text, fontWeight: 700, marginBottom: '4px' }}>
                        This Week's Review
                    </div>
                    <div style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: 1.5 }}>
                        {weekly.motivation}
                    </div>
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: pctColor }}>
                            {weekly.completed > 0 ? pctLabel : '—'} vs last week
                        </span>
                        {weekly.busiestDay !== '—' && (
                            <span style={{ fontSize: '10px', color: theme.textMuted }}>
                                · 🏅 Best day: <strong style={{ color: theme.text }}>{weekly.busiestDay}</strong>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stat cards row */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <StatCard emoji="✅" label="Completed" value={weekly.completed} color="#34d399" theme={theme} />
                <StatCard emoji="📝" label="Created" value={weekly.created} color={theme.accentLight} theme={theme} />
                <StatCard emoji="⚠️" label="Overdue" value={weekly.overdue} color={weekly.overdue > 0 ? '#ef4444' : theme.textMuted} theme={theme} />
            </div>

            {/* Personal vs Team */}
            {(weekly.personalDone + weekly.teamDone) > 0 && (
                <>
                    <SectionTitle theme={theme}>👤 Personal vs 👥 Team</SectionTitle>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <StatCard emoji="👤" label="Personal done" value={weekly.personalDone} theme={theme} />
                        <StatCard emoji="👥" label="Team done" value={weekly.teamDone} color="#60a5fa" theme={theme} />
                    </div>
                </>
            )}

            {/* Daily bar chart */}
            <SectionTitle theme={theme}>📊 Tasks Completed Per Day</SectionTitle>
            <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer>
                    <BarChart data={weekly.byDay} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                        barSize={isMobile ? 18 : 26}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
                        <XAxis dataKey="day" tick={{ fill: theme.textMuted, fontSize: 11, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: 'Outfit' }} allowDecimals={false} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: theme.bgInput }} />
                        <Bar dataKey="completed" name="Completed" radius={[4, 4, 0, 0]}>
                            {weekly.byDay.map((_, i) => (
                                <Cell key={i} fill={i === weekly.byDay.findIndex(d => d.day === weekly.busiestDay) ? '#7c3aed' : theme.accent + 'bb'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Smart insights */}
            <SectionTitle theme={theme}>💡 Smart Insights</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {[
                    weekly.busiestDay !== '—' && `🏆 Your most productive day was ${weekly.busiestDay}.`,
                    weekly.pctChange > 0 && `📈 You improved by ${weekly.pctChange}% compared to last week.`,
                    weekly.pctChange < 0 && `📉 You completed ${Math.abs(weekly.pctChange)}% fewer tasks than last week — keep pushing!`,
                    weekly.overdue > 0 && `⚠️ You have ${weekly.overdue} overdue task${weekly.overdue > 1 ? 's' : ''} — tackle these first.`,
                    weekly.completed === 0 && `🌱 No completed tasks yet this week — let's get started!`,
                    weekly.score >= 80 && `🎯 Great completion rate! You finished ${weekly.completed} of ${weekly.created} tasks created this week.`,
                ].filter(Boolean).map((msg, i) => (
                    <div key={i} style={{
                        padding: '8px 12px', background: theme.bgInput,
                        borderRadius: '8px', fontSize: '12px', color: theme.textSecondary, lineHeight: 1.5,
                    }}>{msg}</div>
                ))}
            </div>
        </div>
    )
}

/* ─── MONTHLY TAB ─── */
function MonthlyView({ stats, theme, isMobile }) {
    const { monthly } = stats

    const pctChange = monthly.completedLastMonth === 0
        ? (monthly.completed > 0 ? 100 : 0)
        : Math.round(((monthly.completed - monthly.completedLastMonth) / monthly.completedLastMonth) * 100)
    const pctColor = pctChange >= 0 ? '#34d399' : '#ef4444'

    return (
        <div>
            {/* Header stats */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <StatCard emoji="✅" label="Completed" value={monthly.completed}
                    sub={`${pctChange >= 0 ? '↑' : '↓'} ${Math.abs(pctChange)}% vs last month`}
                    color="#34d399" theme={theme} />
                <StatCard emoji="📝" label="Created" value={monthly.created} color={theme.accentLight} theme={theme} />
                <StatCard emoji="⏱️" label="Avg Completion"
                    value={monthly.avgCompletionDays != null ? `${monthly.avgCompletionDays}d` : '—'}
                    color="#60a5fa" theme={theme} />
                <StatCard emoji="⚠️" label="Overdue"
                    value={`${monthly.overduePercent}%`}
                    color={monthly.overduePercent > 20 ? '#ef4444' : theme.textMuted}
                    sub={`${monthly.overdue} tasks`}
                    theme={theme} />
            </div>

            {/* Personal vs Team */}
            {(monthly.personalDone + monthly.teamDone) > 0 && (
                <>
                    <SectionTitle theme={theme}>👤 Personal vs 👥 Team</SectionTitle>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <StatCard emoji="👤" label="Personal done" value={monthly.personalDone} theme={theme} />
                        <StatCard emoji="👥" label="Team done" value={monthly.teamDone} color="#60a5fa" theme={theme} />
                    </div>
                </>
            )}

            {/* Weekly breakdown bar chart */}
            <SectionTitle theme={theme}>📊 Completed Per Week — {monthly.monthName}</SectionTitle>
            <div style={{ width: '100%', height: 150 }}>
                <ResponsiveContainer>
                    <BarChart data={monthly.weeklyBreakdown} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={isMobile ? 24 : 36}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: theme.textMuted, fontSize: 11, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: 'Outfit' }} allowDecimals={false} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: theme.bgInput }} />
                        <Bar dataKey="completed" name="Tasks" fill={theme.accent} radius={[4, 4, 0, 0]}>
                            {monthly.weeklyBreakdown.map((entry, i) => (
                                <Cell key={i} fill={entry.name === monthly.mostProductiveWeek ? '#7c3aed' : theme.accent + 'bb'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* 6-month trend line */}
            <SectionTitle theme={theme}>📈 6-Month Productivity Trend</SectionTitle>
            <div style={{ width: '100%', height: 150 }}>
                <ResponsiveContainer>
                    <LineChart data={monthly.trend} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: theme.textMuted, fontSize: 11, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: 'Outfit' }} allowDecimals={false} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip theme={theme} />} />
                        <Line type="monotone" dataKey="completed" name="Completed" stroke={theme.accent}
                            strokeWidth={2.5} dot={{ fill: theme.accent, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Status + Priority pie charts side by side */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                {/* Status distribution */}
                <div style={{ flex: 1, minWidth: '140px' }}>
                    <SectionTitle theme={theme}>🎯 Live Task Status</SectionTitle>
                    <div style={{ width: '100%', height: 140 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={monthly.statusDist} cx="50%" cy="50%" innerRadius={32} outerRadius={56}
                                    dataKey="value" nameKey="name" paddingAngle={3}>
                                    {monthly.statusDist.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill || STATUS_FILL[i]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip theme={theme} />} />
                                <Legend iconType="circle" iconSize={8}
                                    formatter={(v) => <span style={{ fontSize: '10px', color: theme.textSecondary, fontFamily: 'Outfit' }}>{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority distribution */}
                {monthly.priorityDist.length > 0 && (
                    <div style={{ flex: 1, minWidth: '140px' }}>
                        <SectionTitle theme={theme}>🔴 By Priority</SectionTitle>
                        <div style={{ width: '100%', height: 140 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={monthly.priorityDist} cx="50%" cy="50%" innerRadius={32} outerRadius={56}
                                        dataKey="value" nameKey="name" paddingAngle={3}>
                                        {monthly.priorityDist.map((entry, i) => (
                                            <Cell key={i} fill={PRIORITY_FILL[entry.name] || STATUS_FILL[i]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip theme={theme} />} />
                                    <Legend iconType="circle" iconSize={8}
                                        formatter={(v) => <span style={{ fontSize: '10px', color: theme.textSecondary, fontFamily: 'Outfit' }}>{v}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Smart insights */}
            <SectionTitle theme={theme}>💡 Monthly Insights</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {[
                    monthly.mostProductiveWeek && `🏆 ${monthly.mostProductiveWeek} was your most productive week in ${monthly.monthName}.`,
                    monthly.avgCompletionDays != null && `⏱️ You completed tasks in an average of ${monthly.avgCompletionDays} day${monthly.avgCompletionDays !== 1 ? 's' : ''}.`,
                    pctChange > 0 && `📈 You completed ${pctChange}% more tasks than last month — excellent progress!`,
                    pctChange < 0 && `📉 You completed ${Math.abs(pctChange)}% fewer tasks than last month. What slowed you down?`,
                    monthly.overduePercent > 0 && `⚠️ ${monthly.overduePercent}% of tasks missed their deadline — try breaking tasks into smaller chunks.`,
                    monthly.teamDone > monthly.personalDone && `🤝 You're contributing heavily to team tasks. Great collaboration!`,
                    monthly.personalDone > monthly.teamDone && `🧭 Most of your completed work this month was personal tasks.`,
                    monthly.completed >= 30 && `🚀 Over 30 tasks completed this month — you're in elite productivity territory!`,
                ].filter(Boolean).map((msg, i) => (
                    <div key={i} style={{
                        padding: '8px 12px', background: theme.bgInput,
                        borderRadius: '8px', fontSize: '12px', color: theme.textSecondary, lineHeight: 1.5,
                    }}>{msg}</div>
                ))}
            </div>
        </div>
    )
}

/* ─── MAIN PANEL ─── */
export default function ProductivityReview({ isOpen, onClose, isMobile }) {
    const { theme } = useTheme()
    const { stats, loading } = useProductivityStats()
    const [tab, setTab] = useState('weekly')

    if (!isOpen) return null

    return (
        <>
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                zIndex: 199, animation: 'fadeInOverlay 0.2s ease',
            }} />

            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: isMobile ? '100%' : '520px',
                background: theme.bgSecondary,
                borderLeft: isMobile ? 'none' : `1px solid ${theme.border}`,
                zIndex: 200, display: 'flex', flexDirection: 'column',
                fontFamily: 'Outfit, sans-serif',
                animation: 'slideInRight 0.28s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.35)',
            }} role="dialog" aria-label="Productivity Review">

                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '16px 18px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0,
                }}>
                    <span style={{ fontSize: '20px' }}>📊</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: theme.text }}>Productivity Review</div>
                        <div style={{ fontSize: '11px', color: theme.textMuted }}>Your work insights at a glance</div>
                    </div>
                    <button onClick={onClose} aria-label="Close"
                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: theme.bgInput, cursor: 'pointer', color: theme.textSecondary, fontSize: '18px', lineHeight: 1 }}>×</button>
                </div>

                {/* Tab Toggle */}
                <div style={{
                    display: 'flex', padding: '10px 18px 0',
                    borderBottom: `1px solid ${theme.border}`, flexShrink: 0,
                }}>
                    {[
                        { k: 'weekly', l: '📅 Weekly' },
                        { k: 'monthly', l: '🗓️ Monthly' },
                    ].map(t => (
                        <button key={t.k} onClick={() => setTab(t.k)}
                            style={{
                                padding: '8px 18px', borderRadius: '8px 8px 0 0',
                                border: 'none', fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.15s',
                                background: tab === t.k ? theme.accent : 'transparent',
                                color: tab === t.k ? '#fff' : theme.textMuted,
                                borderBottom: tab === t.k ? `2px solid ${theme.accent}` : '2px solid transparent',
                            }}>{t.l}</button>
                    ))}
                </div>

                {/* Scrollable content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 40px', WebkitOverflowScrolling: 'touch' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: theme.textMuted, fontSize: '13px' }}>
                            <div style={{ width: '28px', height: '28px', border: `2px solid ${theme.border}`, borderTop: `2px solid ${theme.accent}`, borderRadius: '50%', animation: 'spinSlow 0.7s linear infinite', margin: '0 auto 12px' }} />
                            Crunching your data...
                        </div>
                    ) : (
                        tab === 'weekly'
                            ? <WeeklyView stats={stats} theme={theme} isMobile={isMobile} />
                            : <MonthlyView stats={stats} theme={theme} isMobile={isMobile} />
                    )}
                </div>
            </div>
        </>
    )
}
