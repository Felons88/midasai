-- Add ANALYZING and ANALYZED statuses to workflow_expansion_status enum
ALTER TYPE workflow_expansion_status ADD VALUE IF NOT EXISTS 'ANALYZING';
ALTER TYPE workflow_expansion_status ADD VALUE IF NOT EXISTS 'ANALYZED';
