import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listDocuments, uploadDocument, deleteDocument } from '../api/documents.api'

export function useDocumentList(projectId) {
  return useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => listDocuments(projectId),
    enabled: !!projectId,
  })
}

export function useUploadDocument(projectId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file) => uploadDocument(projectId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] })
    },
  })
}

export function useDeleteDocument(projectId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId) => deleteDocument(projectId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] })
    },
  })
}
