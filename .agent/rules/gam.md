---
trigger: always_on
---

# Project Rules: AI Tools Directory

## Project Overview
This project is a web directory that lists AI tools and optimization guides. The goal is to help users use tools like Vibecode and Kling more effectively.

## Tech Stack
* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Icons:** Lucide React

## URL Structure & Routing
* **Strict Routing Rule:** Every tool must have its own dedicated URL path at the root level.
* **Pattern:** `localhost:3000/[tool-name]`
* **Examples:**
    * `/vibecode`
    * `/kling`
    * `/midjourney`
* **Implementation:** Use a Next.js Dynamic Segment folder named `app/[slug]/page.tsx` to handle all tool pages dynamically. Do not create separate static folders for each tool.

## Data Structure
Store all data in a single constant file (e.g., `lib/toolsData.ts`). Do not hardcode text in the page templates.

**Interface Definition:**
```typescript
interface Tool {
  slug: string;        // Used for the URL (e.g., "vibecode")
  name: string;        // Display name (e.g., "Vibecode")
  description: string; // Short summary
  category: string;    // e.g., "Video", "Coding", "Image"
  tips: string[];      // List of actionable advice
  integrations: string[]; // Other tools that work well with this one
}
Page Requirements
1. Home Page (app/page.tsx)
Display a search bar at the top.

List all tools in a grid layout.

Each grid item must link directly to the dynamic slug page.

2. Tool Detail Page (app/[slug]/page.tsx)
Header: Show the Tool Name and Description.

Tips Section: Display a clear list of specific usage tips.

Workflow Section: Explain how to use this tool with other AI tools.

404 Handling: If the slug does not exist in the data file, return a generic 404 page.

Coding Standards
Use functional React components.

Keep the design clean and readable.

Use semantic HTML tags (section, article, h1, h2).

Ensure the layout is mobile-responsive.


### Next Step
Would you like me to write the `toolsData.ts` file with the initial data for Vibec