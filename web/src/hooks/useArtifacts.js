import { useQuery } from '@tanstack/react-query'
import { getLatestArtifact, listArtifacts } from '../api/artifacts.api'

export function useLatestArtifact(projectId, type) {
  return useQuery({
    queryKey: ['artifact', projectId, type],
    queryFn: () => getLatestArtifact(projectId, type),
    enabled: !!projectId && !!type,
    retry: false,
  })
}

export function useArtifactHistory(projectId, type) {
  return useQuery({
    queryKey: ['artifactHistory', projectId, type],
    queryFn: () => listArtifacts(projectId, type),
    enabled: !!projectId && !!type,
  })
}
