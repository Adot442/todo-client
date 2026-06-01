import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Todo = {
  id: number | string
  title: string
  completed: boolean
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
  /\/$/,
  '',
)
const TODOS_ENDPOINT = API_BASE_URL ? `${API_BASE_URL}/todos` : ''
const MISSING_API_URL_ERROR = 'Set VITE_API_BASE_URL to load todos from your API.'

const mapTodo = (todo: Partial<Todo> & { id: number | string }): Todo => ({
  id: todo.id,
  title: todo.title ?? '',
  completed: Boolean(todo.completed),
})

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(TODOS_ENDPOINT))
  const [isAdding, setIsAdding] = useState(false)
  const [processingTodoId, setProcessingTodoId] = useState<Todo['id'] | null>(null)
  const [error, setError] = useState(TODOS_ENDPOINT ? '' : MISSING_API_URL_ERROR)

  useEffect(() => {
    if (!TODOS_ENDPOINT) {
      return
    }

    const loadTodos = async () => {
      try {
        setError('')
        const data = await parseResponse<Array<Partial<Todo> & { id: number | string }>>(
          await fetch(TODOS_ENDPOINT),
        )
        setTodos(data.map(mapTodo))
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load todos.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadTodos()
  }, [])

  const handleAddTodo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const title = newTitle.trim()
    if (!title || !TODOS_ENDPOINT) {
      return
    }

    setIsAdding(true)
    setError('')

    try {
      const created = await parseResponse<Partial<Todo> & { id: number | string }>(
        await fetch(TODOS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, completed: false }),
        }),
      )

      setTodos((current) => [mapTodo(created), ...current])
      setNewTitle('')
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to add todo.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleTodo = async (todo: Todo) => {
    if (!TODOS_ENDPOINT) {
      return
    }

    setProcessingTodoId(todo.id)
    setError('')

    try {
      const updated = await parseResponse<Partial<Todo> & { id: number | string }>(
        await fetch(`${TODOS_ENDPOINT}/${todo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: !todo.completed }),
        }),
      )

      setTodos((current) =>
        current.map((item) => (item.id === todo.id ? mapTodo(updated) : item)),
      )
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Unable to update todo.')
    } finally {
      setProcessingTodoId(null)
    }
  }

  const handleDeleteTodo = async (todoId: Todo['id']) => {
    if (!TODOS_ENDPOINT) {
      return
    }

    setProcessingTodoId(todoId)
    setError('')

    try {
      await parseResponse<unknown>(
        await fetch(`${TODOS_ENDPOINT}/${todoId}`, {
          method: 'DELETE',
        }),
      )
      setTodos((current) => current.filter((todo) => todo.id !== todoId))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete todo.')
    } finally {
      setProcessingTodoId(null)
    }
  }

  return (
    <main className="app">
      <h1>Todo List</h1>
      <p className="subtitle">Connected to your API</p>

      <form className="todo-form" onSubmit={handleAddTodo}>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a todo"
          aria-label="Todo title"
        />
        <button type="submit" disabled={isAdding || !newTitle.trim() || !TODOS_ENDPOINT}>
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {isLoading ? (
        <p>Loading todos...</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => {
            const isProcessing = processingTodoId === todo.id
            return (
              <li key={todo.id} className="todo-item">
                <label>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => {
                      void handleToggleTodo(todo)
                    }}
                    disabled={isProcessing}
                  />
                  <span className={todo.completed ? 'done' : ''}>{todo.title}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteTodo(todo.id)
                  }}
                  disabled={isProcessing}
                >
                  Delete
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

export default App
