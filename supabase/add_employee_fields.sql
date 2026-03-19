-- Add employee fields to requisitions table
-- This migration adds employee_id, applicant_name, and department fields

-- Check and add employee_id field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requisitions' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE requisitions ADD COLUMN employee_id TEXT;
    RAISE NOTICE 'Added employee_id column to requisitions table';
  ELSE
    RAISE NOTICE 'employee_id column already exists in requisitions table';
  END IF;
END $$;

-- Check and add applicant_name field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requisitions' AND column_name = 'applicant_name'
  ) THEN
    ALTER TABLE requisitions ADD COLUMN applicant_name TEXT;
    RAISE NOTICE 'Added applicant_name column to requisitions table';
  ELSE
    RAISE NOTICE 'applicant_name column already exists in requisitions table';
  END IF;
END $$;

-- Check and add department field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requisitions' AND column_name = 'department'
  ) THEN
    ALTER TABLE requisitions ADD COLUMN department TEXT;
    RAISE NOTICE 'Added department column to requisitions table';
  ELSE
    RAISE NOTICE 'department column already exists in requisitions table';
  END IF;
END $$;

-- Update existing records with default values if needed
-- This is optional and can be commented out if you don't want to update existing records
UPDATE requisitions 
SET 
  applicant_name = applicant_name,
  department = department,
  employee_id = employee_id
WHERE employee_id IS NULL;

-- Add comment to document the new fields
COMMENT ON COLUMN requisitions.employee_id IS '员工工号';
COMMENT ON COLUMN requisitions.applicant_name IS '申请人姓名';
COMMENT ON COLUMN requisitions.department IS '所属部门';

-- Create index on employee_id for better query performance
CREATE INDEX IF NOT EXISTS idx_requisitions_employee_id ON requisitions(employee_id);

-- Create index on applicant_name for better query performance
CREATE INDEX IF NOT EXISTS idx_requisitions_applicant_name ON requisitions(applicant_name);

RAISE NOTICE 'Migration completed successfully!';
