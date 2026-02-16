import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { generateChunks, searchChunks, getChunkStats } from '../api/chunks.api'

export function useChunkStats(projectId) {
  return useQuery({
    queryKey: ['chunkStats', projectId],
    queryFn: () => getChunkStats(projectId),
    enabled: !!projectId,
  })
}

export function useGenerateChunks(projectId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => generateChunks(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chunkStats', projectId] })
    },
  })
}

export function useSearchChunks(projectId) {
  return useMutation({
    mutationFn: ({ query, topK }) => searchChunks(projectId, query, topK),
  })
}
