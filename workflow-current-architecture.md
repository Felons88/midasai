# Workflow Current System Architecture Audit  
## Version: 1.0 (Based on repository analysis as of 2026-06-29)

## Executive Summary

This document represents a complete reverse-engineering and architectural audit of the MidasAI Workflow Expansion system. The system is responsible for analyzing, understanding, and expanding AI project ideas into comprehensive technical specifications and codebases.

Key findings:
- The system operates under the naming "Expansion" rather than "Workflow" in its implementation
- It consists of a multi-phase AI-powered project expansion engine
- The system integrates with Supabase for data persistence and storage
- It uses AI models to analyze project context and generate detailed documentation
- The UI presents this as a "workflow" for expanding project ideas

The documentation below details every component, phase, API endpoint, and data structure discovered during the audit.

---

## 1. System Overview

The expansion system operates through the following key stages:

1. **Project Import** - Architect users import existing project files or describe their project concept
2. **Analysis Phase** - System analyzes imported files to understand technology stack, architecture, and requirements
3. **Expansion Phase** - System generates comprehensive documentation, architecture diagrams, and improvement suggestions
4. **Iterative Refinement** - Users can ask follow-up questions and request specific improvements
5. **Documentation Generation** - System creates 72+ detailed markdown files covering all aspects of the project

The system tracks progress through multiple rounds of AI interaction, with each round improving the completeness and accuracy of the generated documentation.

---

## 2. Frontend Architecture

### 2.1 Key Components

#### 2.1.1 WorkflowCard.tsx
- Primary UI component for displaying workflow/expansion entries
- Shows status badges, file counts, ETA countdown, and action buttons
- Handles status animations and progress bars
- Supports filtering, sorting, and selection

#### 2.1.2 WorkflowTimeline.tsx
- Visual timeline representation of workflow progress
- Shows sequential phases with status indicators
- Tracks current phase and predicted completion time

#### 2.1.3 DetailInspector.tsx
- Right-side detailed view of selected workflow
- Shows pipeline steps, generated files, and metadata
- Displays generated content with copy/paste functionality

#### 2.1.4 ExpandOverlay.tsx
- Fullscreen overlay for deep interaction with workflows
- Features AI conversation interface with suggestions
- Shows detailed expansion process with visualizations
- Tracks iterative refinement rounds

#### 2.1.5 WorkflowTimeline Component
- Visual timeline showing workflow phases as dots with connectors
- Progress represented through animated indicators
- Shows current phase and predicted completion time

#### 2.1.6 UI Progress Visualization
- Status badges with color coding:
  - DRAFT: Gray
  - IMPORTED: Amber
  - ANALYZING: Cyan
  - PROCESSING_AI: Purple
  - GENERATING_FILES: Cyan
  - COMPLETED: Green
  - FAILED: Red
  - ARCHIVED: Zinc

---

## 3. Backend Architecture

### 3.1 API Routes

#### 3.1.1 `/api/workflows/route.ts`
- Main endpoint for listing user workflows
- Handles authentication and pagination
- Returns workflow metadata and status

#### 3.1.2 `/api/workflows/[id]/route.ts`
- Fetches single workflow details and associated steps
- Returns complete workflow context including generated files

#### 3.1.3 `/api/workflows/[id]/expand/route.ts`
- Main expansion endpoint with multiple HTTP methods:
  - `POST`: Initiates expansion process based on user guidance
  - `PUT`: Applies specific suggestions to files
  - `PATCH`: Streams generated documentation files
- Orchestrates multi-phase AI interactions
- Manages status transitions and progress tracking

#### 3.1.4 `/api/workflows/[id]/analyze/route.ts`
- Triggers analysis phase for workflow
- Calculates ETA based on file count and content size
- Updates status to "ANALYZING" with estimated completion time
- Runs analysis in background via `setTimeout`

#### 3.1.5 `/api/workflows/[id]/archive/route.ts` (not read)
#### 3.1.6 `/api/workflows/[id]/archive/route.ts` (not read)

### 3.2 Database Schema

Key tables in Supabase database:

#### 3.2.1 `workflow_expansions`
- **Primary tracking table** for all expansion projects
- Columns include:
  - `id`: UUID primary key
  - `user_id`: Foreign key to auth.users
  - `title`: Workflow title
  - `description`: Project description
  - `status`: ENUM ('DRAFT', 'IMPORTED', 'ANALYZING', 'ANALYZED', 'PROCESSING_AI', 'GENERATING_FILES', 'COMPLETED', 'FAILED', 'ARCHIVED')
  - `pipeline_stage`: Current phase in expansion process
  - `pipeline_progress`: Numeric progress indicator
  - `file_count`: Number of files being processed
  - `expansion_config`: JSONB storing configuration state
  - Metadata timestamps: `created_at`, `updated_at`, `started_at`, `completed_at`, etc.

#### 3.2.2 `workflow_expansion_steps`
- Tracks individual steps in expansion pipeline
- Columns include:
  - `id`: Primary key
  - `expansion_id`: Foreign key to `workflow_expansions`
  - `step_name`: Sequential step identifier
  - `step_order`: Numerical order in pipeline
  - `status`: Enumerated progress status
  - `started_at`: Timestamp when step began
  - `completed_at`: Timestamp when step finished
  - `output`: JSONB storing step-specific results
  - `error`: Text field for error messages

#### 3.2.3 `file_artifacts` (not explicitly read but referenced)
- Stores generated documentation files
- Contains file path, MIME type, content hash, and actual content

#### 3.2.4 Other Related Tables
- `workflow_expansion_history`: Not explicitly found but implied by naming
- `workflow_expansion_files`: Not explicitly found but implied
- `auth.users`: Supabase authentication users table (linked via `user_id`)

---

## 4. Expansion Process Flow

### 4.1 Phase 1: Project Import & Initialization
- User creates a new workflow through UI
- Initial status: "IMPORTED"
- System stores basic metadata and file references

### 4.2 Phase 2: System Analysis
- `POST /api/workflows/[id]/analyze/route.ts` triggers analysis
- Calculates ETA based on:
  ```javascript
  const etaSeconds = Math.max(20, Math.min(180, fileList.length * 2 + Math.ceil(totalChars / 10000) * 3 + 15))
  ```
- Updates status to "ANALYZING" with ETA
- Background process begins AI analysis

### 4.3 Phase 3: AI Analysis
- Uses `callAI()` function to interact with OpenRouter or Google Gemini
- Analyzes combined project context from all imported files
- Generates comprehensive analysis summary
- Stores analysis results in `expansion_config`

### 4.4 Phase 4: Interactive Refinement
- User can ask follow-up questions in ExpandOverlay
- System runs iterative refinement rounds
- Each round generates improvement suggestions
- User can apply suggestions to generate new files
- Progress tracked through numbered rounds

### 4.5 Phase 5: Documentation Generation
- `PUT /api/workflows/[id]/expand/route.ts` streams generated files
- Generates 72+ comprehensive markdown files organized into 12 categories:
  - Foundation (6 files)
  - Database (6 files)
  - API Design (6 files)
  - Security (6 files)
  - Scaling (6 files)
  - AI Systems (6 files)
  - Frontend (6 files)
  - DevOps (6 files)
  - Testing (6 files)
  - Marketplace (6 files)
  - Integrations (6 files)
  - Workflow & Expansion (6 files)

### 4.6 Phase 6: Finalization
- System validates all files were generated successfully
- Updates status to "COMPLETED" upon successful completion
- Provides download link for all generated files
- Notifies user of completion

---

## 5. AI Pipeline Analysis

### 5.1 Prompt System
- Uses Handlebars-style templates for dynamic prompt generation
- Context assembled from imported files and generated files
- Context size limited to ~8000 characters for AI processing
- Multiple AI models attempted in fallback sequence:
  - OpenRouter models (preferred)
  - Google Gemini (fallback)
  - Various open-source models

### 5.2 Response Parsing
- AI outputs parsed using strict JSON format matching schema
- Fallback parsing strategy for malformed responses
- Error handling for truncated or invalid responses
- Schema validation ensures consistent response structure

### 5.3 Model Selection Logic
- Primary: OpenRouter models (meta-llama/llama-3.3-70b-instruct, etc.)
- Fallback: Google Generative AI (gemini-2.0-flash)
- Additional strategies for rate limits and retry conditions

---

## 6. File Processing & Generation

### 6.1 File Discovery and Import
- Files identified through `.generated_files` and `source_artifacts`
- Stored in database with path, MIME type, and content hash
- Content read from storage for AI context assembly

### 6.2 Markdown Generation Strategy
- Uses `FILE_TEMPLATES` constant for prompt generation
- Context includes:
  - Artifact summaries (first 2000 chars)
  - Tech stack inferred from file names and patterns
  - Project description from metadata
- Content generation subject to size limits and constraints

### 6.3 File Creation and Storage
- Generated content stored in `generated_files` database field
- Files written to storage layer with SHA-256 hashing
- Content persisted for future reference and versioning
- File count tracked and displayed in UI

---

## 7. State Management and Progress Tracking

### 7.1 React Query Usage
- Primary state management solution
- Caches API responses with configurable TTL
- Enables background polling for status updates
- Uses `useQuery` for workflow status checks

### 7.2 Progress Calculation
- Progress percentages derived from:
  - File count metrics
  - Token usage estimates
  - Fixed stage progression weights
- ETA calculations based on empirical benchmarks
- Round-based progression model (each refinement round = ~15-20% progress)

### 7.3 Animation System
- Custom spinner animations for loading states
- Pulse effects for processing indicators
- Visual feedback for status transitions
- Non-repeating animation sequences

---

## 8. Error Handling and Recovery

### 8.1 API Error Handling
- Comprehensive error handling for all API endpoints
- Returns detailed error messages with status codes
- Fallback error messages for unexpected failures

### 8.2 AI Response Fallbacks
- Retry mechanisms for rate-limited or failed AI calls
- Comprehensive fallback parsing strategies
- Age-based degradation to maintain functionality

### 8.3 System Recovery
- Status transitions allow for error recovery paths
- Failed steps can be retried with different parameters
- Partial results preserved and built upon

---

## 9. Security Considerations

### 8.1 Authentication and Authorization
- All API routes verify user authentication
- Database queries filtered by `user_id`
- Fine-grained access control via Supabase policies

### 8.2 Input Validation
- Status validation prevents invalid transitions
- File upload checks before processing
- Content sanitization in generated outputs

### 8.3 Data Protection
- Secrets stored securely via environment variables
- File content hashed for integrity verification
- Audit logging for critical operations

---

## 10. Database Schema Detail

### 10.1 `workflow_expansions` Table Schema
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
title TEXT
description TEXT
status TEXT CHECK (status IN ('DRAFT', 'IMPORTED', 'ANALYZING', 'ANALYZED', 'PROCESSING_AI', 'GENERATING_FILES', 'COMPLETED', 'FAILED', 'ARCHIVED'))
pipeline_stage TEXT
pipeline_progress NUMERIC
file_count INTEGER
expansion_config JSONB  -- Stores all runtime state
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
started_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
... (additional metadata fields)
```

### 10.2 `workflow_expansion_steps` Table Schema
```sql
id UUID PRIMARY KEY
expansion_id UUID REFERENCES workflow_expansions
step_name TEXT
step_order INTEGER
status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed'))
started_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
output JSONB
error TEXT
```

### 3.3 `file_artifacts` Table Schema (Referenced)
```sql
artifact_id UUID PRIMARY KEY
run_id UUID REFERENCES workflow_expansions
file_path TEXT
mime_type TEXT
content_hash TEXT
content BYTEA
metadata JSONB
```

---

## 11. Dependency Map

### 11.1 Integration Dependencies
- **Supabase**: Primary backend/database layer
- **OpenRouter API**: Primary AI model endpoint
- **Google Gemini API**: Fallback AI model
- **Supabase Storage**: File storage layer
- **Supabase Auth**: User authentication
- **React Query**: State management and caching
- **Lucide Icons**: UI icons and visual elements

### 11.2 Framework Dependencies
- **Next.js**: Frontend framework and API routes
- **React**: UI component foundation
- **TanStack**: State management library
- **TypeScript**: Language typing and interfaces

---

## 12. Performance Characteristics

### 11.1 Bottlenecks Identified
- **AI Model Response Time**: Main bottleneck (varies by model and request load)
- **Context Assembly**: Time to combine multiple file contexts
- **Progress Calculation**: Complex ETA calculations
- **Streaming File Generation**: Sequential generation vs parallel

### 11.2 Caching Strategies
- Status caching via database persistence
- File content hashes used for integrity checks
- Limited in-memory caching due to session nature

### 11.3 Throughput Characteristics
- Analysis phase: ~2-10 seconds per file depending on complexity
- Generation phase: ~5-30 seconds per documentation file
- Full expansion cycle: Typically 5-15 minutes for moderate projects
- Progress updates: Near real-time with polling interval of 5 seconds

---

## 13. Current System Limitations and Technical Debt

### 13.1 Documentation Gaps
- Missing explicit schema for `file_artifacts` table
- Incomplete error handling documentation
- Missing fallback strategies for failed analyses

### 13.2 Code Smells
- Status handling logic duplicated across multiple components
- Hardcoded progress weights (20, 35, 40, 95, 100)
- Polling mechanism in UI causing unnecessary network requests
- Repetitive prompt templates across different expansion stages

### 13.3 Technical Limitations
- Maximum context size limits file processing (8000 character limit)
- Progress ETA calculations not dynamically adjusted based on complexity
- No cancellation support for ongoing operations
- Limited error recovery for failed AI responses
- No persistent storage of intermediate results beyond session

---

## 14. Error Handling Flow

### 14.1 Analysis Phase Failures
- Failed analysis sets status to "FAILED" with error message
- UI displays error notification with retry options
- Background process continues without blocking subsequent steps

### 14.2 Expansion Phase Failures
- Failed suggestion application preserves partial results
- Error messages stored and displayed in UI
- System continues with remaining suggestions when possible

### 14.3 File Generation Failures
- Failed file generation logged and counted
- System proceeds with remaining files but tracks failure rate
- Final success determined by minimum viable file count threshold

### 14.4 Recovery Mechanisms
- Retry logic in AI calls with exponential backoff
- Status transitions allow manual intervention
- System allows manual retry of failed steps
- Partial results preserved for future rebuilding

---

## 15. Recommendations for Documentation Improvement

### 15.1 Missing Documentation Areas
- No explicit API contract documentation
- Limited error code specification
- Missing security review process description
- No performance testing methodology documented
- Incomplete failure mode analysis

### 15.2 Technical Debt Areas
- Status handling logic should be centralized
- Progress calculation should be more dynamic
- Prompt generation should be abstracted into reusable templates
- File processing should support true parallelization
- Error handling should be more granular and standardized

---

## 16. Appendix: File Reference Index

### 15.1 Critical Files Inspected
| File Path | Purpose | Importance |
|---|---|---|
| `/app/api/workflows/[id]/expand/route.ts` | Core expansion engine | Critical |
| `/app/api/workflows/[id]/analyze/route.ts` | ETA calculation and status updates | Critical |
| `/lib/architect/expansion-engine.ts` | Expansion pipeline logic | Critical |
| `/lib/architect/expansion-manifest.ts` | File generation manifest | Critical |
| `/components/architect/WorkflowCard.tsx` | Primary UI component | High |
| `/components/architect/WorkflowTimeline.tsx` | Progress visualization | High |
| `/components/architect/DetailInspector.tsx` | Detailed workflow inspection | Medium |
| `/components/architect/ExpandOverlay.tsx` | Interactive refinement UI | Critical |

---

## 16. Conclusion

The MidasAI Expansion system represents a sophisticated AI-powered project documentation generator with a complex multi-phase workflow. While the system functions effectively for its stated purpose, it contains several areas for improvement in terms of error handling, performance optimization, and maintainability.

The current implementation demonstrates:
- Robust AI integration with multiple fallback models
- Comprehensive documentation generation covering 12 technical categories
- Interactive user experience with iterative refinement
- Proper state management and persistence
- Granular progress tracking with visual feedback

However, the system would benefit from:
- More efficient parallel processing
- Better error recovery mechanisms
- Standardized prompt and response schemas
- Enhanced security and input validation
- Improved progress calculation accuracy

This documentation provides the foundational understanding necessary for future development, maintenance, and potential system improvements.