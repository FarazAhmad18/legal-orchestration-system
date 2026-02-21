import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getChatHistory, sendChatMessage } from '../api/chat.api'

export function useChatHistory(projectId) {
  return useQuery({
    queryKey: ['chatHistory', projectId],
    queryFn: () => getChatHistory(projectId),
    enabled: !!projectId,
  })
}

export function useSendMessage(projectId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message) => sendChatMessage(projectId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory', projectId] })
    },
  })
}
