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
      await createProject.mutateAsync({ name, objective })
      toast.success('Project created')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create project')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">New Project</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Smith v. Jones Matter"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Objective
            </label>
            <textarea
              className="block w-full rounded-lg border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm transition-colors duration-150 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-1 placeholder:text-gray-400"
              rows={5}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Describe the analysis objective for this matter..."
              required
            />
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
