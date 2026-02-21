import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useChatHistory, useSendMessage } from '../../hooks/useChat'
import CitationPanel from '../facts/CitationPanel'

// Group user messages as "conversations" for sidebar display
function buildConversationEntries(messages) {
  const entries = []
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7)

  for (const msg of messages) {
    if (msg.role !== 'user') continue
    const date = new Date(msg.createdAt)
    let group = 'Older'
    if (date >= today) group = 'Today'
    else if (date >= yesterday) group = 'Yesterday'
    else if (date >= weekAgo) group = 'Previous 7 days'

    entries.push({
      id: msg.id,
      text: msg.content.length > 40 ? msg.content.slice(0, 40) + '...' : msg.content,
      group,
      createdAt: msg.createdAt,
    })
  }
  return entries
}

export default function ChatPanel({ projectId, open, onClose }) {
  const [input, setInput] = useState('')
  const [selectedCitation, setSelectedCitation] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const scrollContainerRef = useRef(null)

  const { data: historyData, isLoading } = useChatHistory(projectId)
  const sendMutation = useSendMessage(projectId)

  const messages = historyData?.messages || []

  const conversationEntries = useMemo(() => buildConversationEntries(messages), [messages])
  const groupOrder = ['Today', 'Yesterday', 'Previous 7 days', 'Older']
  const groupedEntries = useMemo(() => {
    const groups = {}
    for (const entry of conversationEntries) {
      if (!groups[entry.group]) groups[entry.group] = []
      groups[entry.group].push(entry)
    }
    return groups
  }, [conversationEntries])

  // Auto-scroll to bottom
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, sendMutation.isPending, open])

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 200)
  }, [open])

  // Escape to close
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') {
        if (selectedCitation) setSelectedCitation(null)
        else onClose()
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose, selectedCitation])

  // Auto-resize textarea
  function handleTextareaInput(e) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  function handleSend(e) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || sendMutation.isPending) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    sendMutation.mutate(text)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function scrollToMessage(msgId) {
    const el = document.getElementById(`msg-${msgId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    textareaRef.current?.focus()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex bg-surface-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* ── Sidebar (light theme) ── */}
          <motion.aside
            className="flex h-full flex-col border-r border-surface-200 bg-surface-0"
            initial={{ x: -280 }}
            animate={{ x: 0, width: sidebarCollapsed ? 0 : 280 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            style={{ overflow: 'hidden', minWidth: sidebarCollapsed ? 0 : 280 }}
          >
            {/* Sidebar header */}
            <div className="flex h-14 items-center justify-between border-b border-surface-200 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100">
                  <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-900">Chat</span>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-100 hover:text-gray-600"
                title="Close sidebar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
              </button>
            </div>

            {/* New chat button */}
            <div className="px-3 py-3">
              <button
                onClick={scrollToBottom}
                className="flex w-full items-center gap-2.5 rounded-xl border border-surface-200 px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-surface-100 hover:text-gray-900"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New question
              </button>
            </div>

            {/* Conversation history */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              {conversationEntries.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-gray-400">No conversations yet</p>
              ) : (
                groupOrder.map((group) =>
                  groupedEntries[group] ? (
                    <div key={group} className="mb-4">
                      <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        {group}
                      </div>
                      {groupedEntries[group].map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => scrollToMessage(entry.id)}
                          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-surface-100 hover:text-gray-900"
                        >
                          <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                          </svg>
                          <span className="truncate">{entry.text}</span>
                        </button>
                      ))}
                    </div>
                  ) : null
                )
              )}
            </nav>

            {/* Back to project */}
            <div className="border-t border-surface-200 p-3">
              <button
                onClick={onClose}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-gray-500 transition-colors hover:bg-surface-100 hover:text-gray-900"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back to project
              </button>
            </div>
          </motion.aside>

          {/* ── Main chat area ── */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Top bar */}
            <div className="flex h-14 items-center justify-between border-b border-surface-200 px-4">
              <div className="flex items-center gap-2">
                {sidebarCollapsed && (
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="mr-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-100 hover:text-gray-600"
                    title="Open sidebar"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                    </svg>
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100">
                    <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Document Chat</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                DRAFT — Human review required
              </div>
            </div>

            {/* Messages — centered like ChatGPT */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl px-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-32">
                    <div className="flex items-center gap-3 text-gray-400">
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm">Loading conversation...</span>
                    </div>
                  </div>
                ) : messages.length === 0 && !sendMutation.isPending ? (
                  /* Empty state */
                  <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-brand-50">
                      <svg className="h-10 w-10 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">What would you like to know?</h2>
                    <p className="mt-2 max-w-md text-sm text-gray-500">
                      Ask questions about your project documents. Every answer includes citations linked to source material.
                    </p>
                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                      {[
                        { label: 'Summarize key facts', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z' },
                        { label: 'What are the main issues?', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
                        { label: 'Timeline of events', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
                      ].map((q) => (
                        <button
                          key={q.label}
                          onClick={() => { setInput(q.label); textareaRef.current?.focus() }}
                          className="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-0 px-4 py-3 text-left text-sm text-gray-600 transition-all hover:border-brand-200 hover:bg-brand-50/50 hover:text-gray-900"
                        >
                          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={q.icon} />
                          </svg>
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Message thread */
                  <div className="py-6">
                    {messages.map((msg) => (
                      <div key={msg.id} id={`msg-${msg.id}`} className="mb-6">
                        {msg.role === 'user' ? (
                          <div className="flex justify-end">
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="max-w-[75%] rounded-2xl rounded-br-md bg-brand-600 px-5 py-3 text-white"
                            >
                              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
                              <p className="mt-1 text-xs text-white/50">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </motion.div>
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4"
                          >
                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                              <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="whitespace-pre-wrap text-[15px] leading-7 text-gray-800">{msg.content}</p>
                              {msg.citations && msg.citations.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {msg.citations.map((cit, i) => (
                                    <button
                                      key={i}
                                      onClick={() => setSelectedCitation(cit)}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                                    >
                                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                      </svg>
                                      {cit.filename || 'Document'} p.{cit.page_number}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <p className="mt-2 text-xs text-gray-400">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {sendMutation.isPending && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4"
                      >
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                          <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                        </div>
                        <div className="flex items-center gap-1 pt-3">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: '0ms' }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: '150ms' }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: '300ms' }} />
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Input — pinned bottom, centered */}
            <div className="border-t border-surface-100 bg-surface-0 pb-6 pt-4">
              <div className="mx-auto max-w-3xl px-4">
                <form onSubmit={handleSend}>
                  <div className="flex items-end rounded-2xl border border-surface-300 bg-surface-0 shadow-sm transition-all focus-within:border-brand-400 focus-within:shadow-md focus-within:ring-4 focus-within:ring-brand-500/10">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleTextareaInput}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about your documents..."
                      disabled={sendMutation.isPending}
                      rows={1}
                      className="flex-1 resize-none bg-transparent py-4 pl-5 pr-2 text-[15px] leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-50"
                      style={{ maxHeight: '200px' }}
                    />
                    <div className="p-2.5">
                      <button
                        type="submit"
                        disabled={!input.trim() || sendMutation.isPending}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white transition-all hover:bg-brand-700 disabled:bg-surface-200 disabled:text-gray-400 active:scale-95"
                      >
                        {sendMutation.isPending ? (
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
                <p className="mt-2.5 text-center text-xs text-gray-400">
                  Responses are AI-generated draft analysis with source citations. Always verify before use.
                </p>
              </div>
            </div>
          </div>

          {/* Citation Panel */}
          {selectedCitation && (
            <CitationPanel
              citation={selectedCitation}
              onClose={() => setSelectedCitation(null)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
