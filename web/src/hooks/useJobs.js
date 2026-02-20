import { useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { runAnalysis, getPipelineStatus, listJobs } from '../api/jobs.api'

export function usePipelineStatus(projectId) {
  const queryClient = useQueryClient()
  const prevStatusRef = useRef(null)

  return useQuery({
    queryKey: ['pipelineStatus', projectId],
    queryFn: async () => {
      const data = await getPipelineStatus(projectId)

      // When pipeline transitions from running → completed/failed, invalidate artifacts
      const prev = prevStatusRef.current
      if (prev === 'running' && data.overallStatus !== 'running') {
        queryClient.invalidateQueries({ queryKey: ['artifact', projectId] })
      }
      prevStatusRef.current = data.overallStatus

      return data
    },
    enabled: !!projectId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.overallStatus === 'running') return 3000
      return false
    },
  })
}

export function useRunAnalysis(projectId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => runAnalysis(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelineStatus', projectId] })
      queryClient.invalidateQueries({ queryKey: ['jobs', projectId] })
      queryClient.invalidateQueries({ queryKey: ['artifact', projectId] })
    },
  })
}

export function useJobs(projectId) {
  return useQuery({
    queryKey: ['jobs', projectId],
    queryFn: () => listJobs(projectId),
    enabled: !!projectId,
  })
}
