# AI Voice Agent Hackathon Platform

Enterprise-grade hackathon management platform for AI Voice Agent Hackathons.

## Project Structure

This project is configured as a monorepo using [Turborepo](https://turbo.build/) and `pnpm` workspaces.

```
├── apps
│   ├── api          # API service / Backend
│   └── web          # Next.js / React Frontend application
└── packages
    └── shared       # Shared typescript configurations, utilities, and components
```

## Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (v9 or higher recommended)

### Installation

Install dependencies from the root directory:

```bash
pnpm install
```

### Running Locally

To start the development servers for all applications concurrently:

```bash
pnpm dev
```

To run a specific application:

- Frontend web app:
  ```bash
  pnpm dev:web
  ```
- Backend API service:
  ```bash
  pnpm dev:api
  ```

### Build

To build all apps and packages:

```bash
pnpm build
```
