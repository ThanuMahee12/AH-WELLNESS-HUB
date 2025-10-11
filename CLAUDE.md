# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blood Lab Manager is a React-based web application for managing blood lab operations. The project is in early development stages, currently using Vite + React template as its foundation.

## Development Commands

- **Start dev server**: `npm run dev` - Starts Vite dev server with HMR
- **Build**: `npm run build` - Production build to `dist/` directory
- **Lint**: `npm run lint` - Run ESLint on all files
- **Preview build**: `npm run preview` - Preview production build locally

## Tech Stack

- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Language**: JavaScript (JSX)
- **Linting**: ESLint 9.x with React Hooks and React Refresh plugins

## Project Structure

- `src/main.jsx` - Application entry point, mounts React to `#root` div
- `src/App.jsx` - Main application component (currently template boilerplate)
- `index.html` - HTML shell
- `vite.config.js` - Vite configuration with React plugin
- `eslint.config.js` - ESLint flat config with React-specific rules

## Code Conventions

- **Unused variables**: ESLint allows unused variables if they match pattern `^[A-Z_]` (constants/exports)
- **ES Modules**: Project uses ESM (`"type": "module"` in package.json)
- **JSX files**: Use `.jsx` extension for files containing JSX

## Known Issues

- `src/main.jsx:3` imports `./index.css` which was removed
- `src/App.jsx:2-4` imports removed assets (`react.svg`, `vite.svg`, `App.css`)

These imports need to be cleaned up before the application can run.
