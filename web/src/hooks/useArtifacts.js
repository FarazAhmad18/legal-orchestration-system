import { useQuery } from '@tanstack/react-query'
import { getLatestArtifact } from '../api/artifacts.api'

export function useLatestArtifact(projectId, type) {
  return useQuery({
    queryKey: ['artifact', projectId, type],
    queryFn: () => getLatestArtifact(projectId, type),
    enabled: !!projectId && !!type,
    retry: false,
  })
}
