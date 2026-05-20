# Chapter 05: Creating Course Content

---

Content is the reason people join. This lesson walks through how hyperlocal's content model works — Courses, Chapters, and Pages — and how to create and organize your first course through the admin UI.

You do not need to write code. You need a clear idea of what your course covers and the content to fill it.

---

## The Content Hierarchy

Hyperlocal organizes course content as a three-level tree:

```
Course
└── Chapter (groups related lessons)
    └── Page (individual lesson — has title, HTML content, status)
```

**Course** — the top-level container. Has a title, description, slug, hero section, and custom CSS. Members enroll in a course and track progress across its lessons.

**Chapter** — an organizational unit inside a course. Has a title and sort order. Groups related pages. Shown in the course sidebar and table of contents.

**Page** — a single lesson. Has a title, description, slug, publish status, and a `trustedHtml` field that holds the rendered lesson content. The `status` field controls access.

---

## Page Status Values

| Status | Who can see it |
|---|---|
| `draft` | Nobody — not visible in the course index |
| `published` | Anyone who can reach the course, including unauthenticated visitors |
| `membership` | Only members with an active tier whose access patterns match the URL |

> **Note:** The `published` status makes a lesson publicly visible even to unauthenticated visitors. Use this for your hook content — the lesson(s) you want potential members to read before signing up. Gate everything else behind `membership`.

---

## Creating a Page (Lesson)

Pages are the atomic unit of content. Create them first, then organize them into chapters.

> **Action:** In the Keystone admin UI, navigate to **Pages** → **Create Page**.

Key fields to fill:

| Field | Notes |
|---|---|
| `title` | The lesson title — shown in the sidebar and `<h1>` |
| `description` | One-sentence summary for the course index |
| `slug` | URL segment — lowercase, hyphenated, unique. e.g. `welcome-to-the-club` |
| `status` | `published` for free preview lessons; `membership` for paid content |
| `publishedAt` | Set to today or leave blank; used for sorting |
| `trustedHtml` | The lesson body. Paste HTML here or use a markdown-to-HTML pipeline. |

> **Note:** The `trustedHtml` field renders raw HTML into the lesson page. It is called "trusted" because no sanitization is applied — it is assumed that only admins write content. Never expose this field to end-user input.

---

## Writing Lesson Content

There are two ways to produce the HTML for `trustedHtml`:

### Option A — Write HTML directly

Write HTML in any editor and paste it into the `trustedHtml` field. The lesson page wraps your HTML in `<article class="chapter">`, so your content renders inside that container.

### Option B — Use the markdown pipeline (developer path)

If you or a developer on your team is comfortable with the codebase, lesson content lives as Markdown files in `seed-data/lessons/`. The seed pipeline converts them to HTML via a `markdownToHtml()` function that adds callout styling, code block labels, and a closing section wrapper automatically.

For ongoing content updates, run:

```bash
pnpm course:publish
```

This re-renders all markdown files and updates `trustedHtml` in the database without wiping any other data.

> **Aside:** The markdown pipeline exists because writing raw HTML is tedious. If you plan to produce a lot of content, setting up the markdown workflow pays for itself quickly. The README in `seed-data/lessons/` documents the authoring conventions.

---

## Creating a Course

Once you have at least a few pages, create the course container.

> **Action:** Navigate to **Courses** → **Create Course**.

Key fields:

| Field | Notes |
|---|---|
| `title` | Your course name |
| `description` | Shown on the course landing page and in meta tags |
| `slug` | URL segment — the course lives at `/courses/{slug}` |
| `status` | `published` makes the course listing visible; `draft` hides it |
| `publishedAt` | Publication date |
| `heroEnabled` | Whether to show a hero section on the course landing page |
| `customCss` | Per-course CSS injected on lesson pages. Controls fonts, code block styling, callout colors. |

---

## Creating Chapters

Chapters are created inside the Course editor.

> **Action:** Open your course record. Scroll to the **Chapters** section. Click **Create Chapter**.

| Field | Notes |
|---|---|
| `title` | Chapter name — shown in sidebar ("Chapter 1: Getting Started") |
| `sortOrder` | Integer — determines chapter order. 1 is first. |
| `pages` | Multi-select relationship — pick the pages that belong to this chapter, in order |

Create as many chapters as your course structure requires. A typical course structure:

- 1–2 pages per short chapter (orientation, setup)
- 3–5 pages per deep chapter (core concept + supporting lessons)
- 1 closing chapter (wrap-up, next steps)

---

## Linking the Course to the Homepage

To make your course the default landing page for your site, go to **Settings** and set `rootCourse` to your newly created course. Now navigating to `/` will route to the course landing page.

> **Action:** Settings → `rootCourse` → select your course → Save.

---

## Previewing Your Content

Navigate to `http://localhost:7777/courses/{your-slug}` to see the course landing page as a member would see it. Click into a published lesson to verify the layout, typography, and any custom CSS renders correctly.

---

## What's Next

You have a course with chapters and lessons. In the next lesson we will look at exactly how the content gate works — what members see when they hit a gated lesson without the right tier, and how to verify your access patterns are doing what you expect.

## Content First, Distribution Second

Most platforms encourage you to think about distribution before content. Hyperlocal inverts that. Build something worth reading, gate it, and *then* focus on getting people to pay for it. The content is the product. Everything else is logistics.
