import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
    const { user } = useAuth()
    const [projects, setProjects] = useState([])
    const [members, setMembers] = useState({}) // keyed by project_id
    const [loadingProjects, setLoadingProjects] = useState(true)

    // Fetch user's projects
    const fetchProjects = useCallback(async () => {
        if (!user) return
        setLoadingProjects(true)
        const { data } = await supabase
            .from('project_members')
            .select('project_id, role, projects(id, name, description, owner_id, invite_code, created_at)')
            .eq('user_id', user.id)

        if (data) {
            const projs = data
                .filter(d => d.projects)
                .map(d => ({ ...d.projects, myRole: d.role }))
            setProjects(projs)

            // Fetch members for all projects
            const allProjectIds = projs.map(p => p.id)
            if (allProjectIds.length > 0) {
                const { data: allMembers } = await supabase
                    .from('project_members')
                    .select('project_id, user_id, role, profiles(id, email, display_name, avatar_url)')
                    .in('project_id', allProjectIds)

                if (allMembers) {
                    const grouped = {}
                    allMembers.forEach(m => {
                        if (!grouped[m.project_id]) grouped[m.project_id] = []
                        grouped[m.project_id].push({
                            userId: m.user_id,
                            role: m.role,
                            ...(m.profiles || {}),
                        })
                    })
                    setMembers(grouped)
                }
            }
        }
        setLoadingProjects(false)
    }, [user])

    useEffect(() => { fetchProjects() }, [fetchProjects])

    // Get all members across all projects (for avatar lookups)
    const getAllMembers = useCallback(() => {
        const allMap = {}
        Object.values(members).forEach(memberList => {
            memberList.forEach(m => {
                if (!allMap[m.userId]) allMap[m.userId] = m
            })
        })
        return Object.values(allMap)
    }, [members])

    const getMembersForProject = (projectId) => {
        return members[projectId] || []
    }

    const createProject = async (name, description = '') => {
        if (!user) return { error: 'Not authenticated' }

        const { data, error } = await supabase
            .from('projects')
            .insert({ name, description, owner_id: user.id })
            .select()
            .single()

        if (data) {
            // Member insertion is now handled automatically by the 'on_project_created' DB trigger
            await fetchProjects()
        }
        return { data, error }
    }

    const joinProject = async (inviteCode) => {
        if (!user) return { error: 'Not authenticated' }

        // Use the secure RPC function to bypass RLS and insert the membership atomically
        const { data, error } = await supabase.rpc('join_project_by_invite', {
            invite_code_input: inviteCode.trim()
        })

        if (!error && data) {
            await fetchProjects()
            return { error: null }
        }

        return { error: error?.message || 'Invalid invite code' }
    }

    const updateProject = async (projectId, updates) => {
        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single()

        if (data) await fetchProjects()
        return { data, error }
    }

    const removeMember = async (projectId, userId) => {
        const { error } = await supabase
            .from('project_members')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', userId)

        if (!error) await fetchProjects()
        return { error }
    }

    const value = {
        projects,
        members,
        loadingProjects,
        getAllMembers,
        getMembersForProject,
        createProject,
        joinProject,
        updateProject,
        removeMember,
        fetchProjects,
    }

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    )
}

export function useProject() {
    const context = useContext(ProjectContext)
    if (!context) throw new Error('useProject must be used within ProjectProvider')
    return context
}
