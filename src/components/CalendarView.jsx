import React, { useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const PRI_COLORS = {
  high: { bg: '#ef4444', border: '#dc2626' },
  medium: { bg: '#f59e0b', border: '#d97706' },
  low: { bg: '#22c55e', border: '#16a34a' },
}

export default function CalendarView({ tasks, onEditTask, onUpdateDueDate, isMobile }) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const calendarRef = useRef(null)

  const events = tasks
    .filter(t => t.due_date)
    .map(t => {
      const c = PRI_COLORS[t.priority] || PRI_COLORS.medium
      const isAssignedToMe = t.assigned_user_id === user?.id
      return {
        id: t.id, title: t.title, date: t.due_date,
        backgroundColor: c.bg, borderColor: isAssignedToMe ? '#fff' : c.border,
        textColor: '#fff',
        extendedProps: { task: t, isAssignedToMe },
        classNames: isAssignedToMe ? ['fc-event-mine'] : [],
      }
    })

  return (
    <div style={{
      padding: isMobile ? '10px' : '16px 20px', flex: 1, overflow: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      <div style={{
        background: theme.bgSecondary, border: `1px solid ${theme.border}`,
        borderRadius: isMobile ? '10px' : '14px', padding: isMobile ? '10px' : '20px',
      }}>
        <style>{`
          .fc { font-family: 'Outfit', sans-serif !important; }
          .fc .fc-toolbar-title { color: ${theme.text} !important; font-size: ${isMobile ? '15px' : '18px'} !important; font-weight: 700 !important; }
          .fc .fc-button {
            background: ${theme.accentBg} !important; border: 1px solid ${theme.border} !important;
            color: ${theme.accentLight} !important; font-family: Outfit !important;
            font-weight: 500 !important; font-size: ${isMobile ? '11px' : '12px'} !important;
            border-radius: 6px !important; padding: ${isMobile ? '6px 8px' : '5px 12px'} !important;
          }
          .fc .fc-button:hover { background: ${theme.bgHover} !important; }
          .fc .fc-button-active { background: ${theme.accent}33 !important; }
          .fc .fc-daygrid-day { background: transparent !important; border-color: ${theme.border} !important; }
          .fc .fc-daygrid-day-number { color: ${theme.textSecondary} !important; font-size: ${isMobile ? '11px' : '12px'} !important; font-weight: 500 !important; }
          .fc .fc-col-header-cell-cushion { color: ${theme.textSecondary} !important; font-size: ${isMobile ? '10px' : '12px'} !important; font-weight: 600 !important; text-transform: uppercase !important; }
          .fc .fc-daygrid-day.fc-day-today { background: ${theme.accentBg} !important; }
          .fc .fc-event { border-radius: 4px !important; padding: 1px 4px !important; font-size: ${isMobile ? '10px' : '11px'} !important; cursor: pointer !important; }
          .fc .fc-scrollgrid, .fc th { border-color: ${theme.border} !important; }
          .fc .fc-more-link { color: ${theme.accentLight} !important; font-weight: 600 !important; }
          .fc-event-mine { box-shadow: 0 0 0 2px rgba(255,255,255,0.6) !important; }
        `}</style>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          editable={true}
          eventClick={(info) => onEditTask(info.event.extendedProps.task)}
          eventDrop={(info) => onUpdateDueDate(info.event.id, info.event.startStr)}
          headerToolbar={isMobile
            ? { left: 'prev,next', center: 'title', right: 'today' }
            : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }
          }
          height="auto"
          dayMaxEvents={isMobile ? 2 : 3}
          longPressDelay={300}
        />
      </div>

      <div style={{
        display: 'flex', gap: isMobile ? '12px' : '16px',
        justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap',
      }}>
        {[{ l: 'High', c: '#ef4444' }, { l: 'Medium', c: '#f59e0b' }, { l: 'Low', c: '#22c55e' }].map(i => (
          <div key={i.l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: theme.textMuted }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: i.c }} />{i.l}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: theme.textMuted }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#fff', border: '1px solid #999' }} />Assigned to you
        </div>
      </div>
    </div>
  )
}
