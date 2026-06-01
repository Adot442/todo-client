# todo-client

A React todo list client that consumes a REST API.

## Setup

```bash
npm install
npm run dev
```

Create a `.env` file with your API base URL:

```bash
VITE_API_BASE_URL=https://your-api.example.com
```

The app calls these endpoints:

- `GET /todos`
- `POST /todos` with `{ "title": string, "completed": boolean }`
- `PATCH /todos/:id` with `{ "completed": boolean }`
- `DELETE /todos/:id`

## Quality checks

```bash
npm run lint
npm run build
```
