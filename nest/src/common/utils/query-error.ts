import { QueryFailedError } from 'typeorm';

const UniqueViolationCode = '23505';

// https://www.postgresql.org/docs/current/errcodes-appendix.html
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === UniqueViolationCode
  );
}
