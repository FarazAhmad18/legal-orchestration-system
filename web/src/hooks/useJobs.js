import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { runAnalysis, getPipelineStatus, listJobs } from '../api/jobs.api'

export function usePipelineStatus(projectId) {
  return useQuery({
    queryKey: ['pipelineStatus', projectId],
    queryFn: () => getPipelineStatus(projectId),
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
