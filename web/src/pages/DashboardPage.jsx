import { Link } from 'react-router-dom'
import { useProjectList } from '../hooks/useProjects'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function DashboardPage() {
  const { data: projects, isLoading, error } = useProjectList()

  if (isLoading) return <LoadingSpinner className="mt-12" />
  if (error) return <p className="text-red-600">Failed to load projects</p>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Link to="/projects/new">
          <Button>New Project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">No projects yet. Create your first project to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900">
                  {project.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                  {project.objective}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  <span>
                    {project._count?.documents ?? 0} doc{project._count?.documents !== 1 ? 's' : ''}
                    {' · '}
                    {project.creator?.email}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
