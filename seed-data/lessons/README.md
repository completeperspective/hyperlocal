# Lesson Authoring Conventions

Lesson files in this directory are the **single source of truth** for course content.
The seed pipeline and `pnpm course:dist` transform them to styled HTML automatically.

---

## File naming

Files are named by lesson slug: `01-create-project.md`, `02-project-tooling.md`, etc.
The filename (without `.md`) must match the `slug` field in `seed-data/lesson-pages.ts`.

---

## Chapter heading & branch annotation

The first line must be the chapter heading. The second block (after a blank line)
must be the branch annotation paragraph:

```markdown
# Chapter 01: Create Project

**Branch:** `00-start` → `01-create-project`
```

The transformer emits `<p class="chapter-meta">` for the branch line.

---

## Callouts

Callout blockquotes use one of three lead keywords as the **first word in bold**:

```markdown
> **Action:** Instructional step the reader must take.

> **Note:** Important clarification or warning.

> **Aside:** Background context or supplementary info.
```

| Keyword  | CSS class        | Colour |
| -------- | ---------------- | ------ |
| `Action` | `callout-action` | Blue   |
| `Note`   | `callout-note`   | Amber  |
| `Aside`  | `callout-aside`  | Purple |

Any other blockquote (e.g. `> **The principle...**`) renders as a plain `<blockquote>`.

---

## Code blocks with file labels

Add the label after the language token in the opening fence, separated by a space:

````markdown
```typescript keystone.ts
// code here
```

```json package.json (dependencies)
{
  "next": "15.1.11"
}
```
````

The transformer emits `<span class="code-label">filename</span>` above the code block.
Code blocks without a label (language token only) render normally.

---

## Closing section

The **last `## heading`** in the file is automatically wrapped in
`<section class="closing">` — no special syntax needed. Always make the final h2
the summary/wrap-up section for consistent styling.

---

## Content update workflow

1. Edit the relevant `.md` file here
2. Preview: `pnpm course:dist` → open `dist/course/[course-slug]/index.html`
3. Publish to local dev: `pnpm course:publish`
4. Publish to any environment: `DATABASE_URL=<url> pnpm course:publish`
