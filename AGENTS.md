### 🔄 Project Awareness & Context

- **Always read the `docs`** folder of the project(s) you are focusing on before implementing any tasks to understant important project information and design patterns to follow.
- **Always read `PLANNING.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints. if the files do not exist, or they are empty, please prompt with "Looks like the plan is wide open!".
- **Check `TASK.md`** before starting a new task. If the task isn’t listed, add it with a brief description and today's date.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.

### Special User Inputs

If you notice this pattern in the prompt, please use these flags to only define the scope for the tasks. ONLY focus on these projects when asked to implement tasks. Respond with "Ok, lets ONLY focus on: [PROJECTS IN SCOPE]".

- **focus** ONLY on specific projects and folders. Make sure to read all relevant documentation in each project and folder mentioned.

### 🧱 Code Structure & Modularity

- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
- **Use clear, consistent imports** (prefer relative imports within packages).

### 🧪 Testing & Reliability

- **Always create react testing library unit tests for new features** (functions, classes, routes, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should be colocated with new files** using the nameing convention `COMPONENT_NAME.test.tsx`.

- Include at least:

- 1 test for expected use

- 1 edge case

- 1 failure case

### ✅ Task Completion

- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to `TASK.md` under a “Discovered During Work” section.

### 📎 Style & Conventions

- **Use TypeScript** as the primary language.
- **Use Nextjs** for client side app, and backend to connect to keystone context directly
- **Use `keystonejs`** for data modeling and access control.

### 📚 Documentation & Explainability

- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.
- ALWAYS **save artifacts** in the related project's /docs folder.

### 🧠 AI Behavior Rules

- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified npm packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `TASK.md`.
- **ALWAYS STOP** before committing any code so that it can be reviewed.
- **ALWAYS** use the best agent available for each task
