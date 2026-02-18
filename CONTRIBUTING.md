# Contributing

Contributions are welcome! Please open an issue before submitting large PRs.

## Development Setup

```bash
git clone https://github.com/cpfarhood/headlamp-rook-ceph-plugin.git
cd headlamp-rook-ceph-plugin
npm install
npm start   # hot-reload dev server
```

## Before Submitting

```bash
npm run tsc      # must exit 0
npm run lint     # must exit 0
npm test         # all tests must pass
npm run build    # must succeed
```

## Coding Conventions

- Functional React components only — no class components
- TypeScript strict mode: no `any`, use `unknown` + type guards at API boundaries
- All imports from `@kinvolk/headlamp-plugin/lib` and `@kinvolk/headlamp-plugin/lib/CommonComponents`
- No additional UI libraries (no direct MUI imports, no Ant Design, etc.)
- Context provider (`RookCephDataProvider`) wraps each route component in `index.tsx`
- Tests: vitest + @testing-library/react, mock with `vi.mock('@kinvolk/headlamp-plugin/lib', ...)`

## License

By contributing, you agree your contributions will be licensed under Apache-2.0.
