-- Add IMPORTED status to workflow_expansion_status enum
-- This status represents workflows sent from Architect with files but not yet expanded
ALTER TYPE public.workflow_expansion_status ADD VALUE IF NOT EXISTS 'IMPORTED' AFTER 'DRAFT';
