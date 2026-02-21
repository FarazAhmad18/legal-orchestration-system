import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateProject } from '../hooks/useProjects'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'

export default function CreateProjectPage() {
  const [name, setName] = useState('')
  const [objective, setObjective] = useState('')
  const navigate = useNavigate()
  const createProject = useCreateProject()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const project = await createProject.mutateAsync({ name, objective })
      toast.success('Project created')
      navigate(`/projects/${project.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create project')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">New Project</h1>
      <p className="mb-6 text-sm text-gray-500">Set up a new matter for document analysis.</p>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Smith v. Jones Matter"
            autoFocus
            required
          />
          <div>
            <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-1.5">
              Objective
            </label>
            <textarea
              id="objective"
              className="block w-full rounded-lg border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm transition-colors duration-150 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-1 placeholder:text-gray-400"
              rows={5}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Describe the analysis objective for this matter..."
              required
            />
            <p className="mt-1.5 text-xs text-gray-400">{objective.length} characters</p>
          </div>
          <div className="flex gap-3">
            <Button type="submit" loading={createProject.isPending}>
              Create Project
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
