# CRC Hub Study Designer Constitution

## Core Principles

### I. Clinical Research Focus
Every feature must directly support clinical research coordinators in designing, managing, and executing clinical trials. The application prioritizes usability for healthcare professionals who work with patients and need reliable, intuitive tools for study management.

### II. Study-Centric Architecture
The application is organized around study configurations, with clear separation between study definitions, visit schedules, staff assignments, and document generation. Each study is self-contained with its own timeline, checklists, and documentation.

### III. Paper-First Design
The application supports clinical sites that prefer paper-based workflows. All generated documents must be print-friendly and comprehensive enough to replace manual spreadsheets and checklists. Digital features enhance but don't replace paper workflows.

### IV. Monorepo Structure
The application uses a monorepo with clear package boundaries: core framework, Svelte components, study configuration language, server backend, and web application. Each package has specific responsibilities and clear interfaces.

### V. Type Safety & Testing
TypeScript is mandatory for all new code. Test-driven development is required for critical study management features. Integration tests must cover study configuration, timeline generation, and document output.

## Technology Stack

### Frontend
- **Framework**: Svelte 5 with TypeScript
- **Build System**: Vite with hot reloading
- **Styling**: Custom CSS DSL with Tailwind CSS
- **State Management**: MobX for reactive state
- **UI Components**: Custom Svelte components with bits-ui

### Backend
- **Runtime**: Node.js with TypeScript
- **Server**: Koa.js with middleware
- **Storage**: JSON-based file system (expandable to databases)
- **Authentication**: Azure MSAL integration

### Development
- **Package Manager**: npm with workspaces
- **Testing**: Jest and Vitest
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Documentation**: Markdown with embedded examples

## Clinical Research Requirements

### Study Configuration
- Support for complex study timelines with multiple visit types
- Staff scheduling and availability management
- Checklist generation for each visit type
- Document templates for informed consent, protocols, and reports

### Compliance
- Audit trails for all study modifications
- Version control for study configurations
- Export capabilities for regulatory submissions
- Data integrity validation

### User Experience
- Intuitive timeline visualization
- Drag-and-drop study design
- Real-time validation and error reporting
- Mobile-responsive design for tablet use

## Development Workflow

### Code Organization
- Core framework in `packages/core`
- Svelte components in `packages/core-svelte`
- Study language in `packages/languages/study-configuration`
- Web application in `packages/webapp-crchub`
- Server backend in `packages/server-crchub`

### Quality Gates
- All new features require TypeScript types
- Study configuration changes require integration tests
- Document generation must be tested with real study data
- Performance testing for large studies (100+ visits)

### Deployment
- Development builds with hot reloading
- Production builds optimized for performance
- Static asset generation for document templates
- Server deployment with health checks

## Governance

This constitution defines the fundamental principles for the CRC Hub Study Designer. All development must align with these principles, prioritizing clinical research needs and maintaining the paper-first workflow that healthcare professionals require.

**Version**: 1.0.0 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-01-27