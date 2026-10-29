import { QueryFailedError } from 'typeorm';

const UniqueViolationCode = '23505';
const ForeignKeyViolationCode = '23503';

// https://www.postgresql.org/docs/current/errcodes-appendix.html
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === UniqueViolationCode
  );
}

// A delete that a row of another table still references
export function isForeignKeyViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === ForeignKeyViolationCode
  );
}
