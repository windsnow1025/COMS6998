import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../common/utils/query-error';
import { AllowedDomain } from './allowed-domain.entity';
import { WhitelistedEmail } from './whitelisted-email.entity';

export const SignUpDeniedMessage =
  'Sign-up is limited to approved email domains and addresses';

export function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^@/, '');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Whether an address may create an account: with nothing listed, any address; otherwise an address whose domain is listed, or an address listed itself
export function isSignUpAllowed(
  email: string,
  domains: string[],
  emails: string[],
): boolean {
  if (domains.length === 0 && emails.length === 0) {
    return true;
  }
  const normalized = normalizeEmail(email);
  const domain = normalized.slice(normalized.lastIndexOf('@') + 1);
  return domains.includes(domain) || emails.includes(normalized);
}

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(AllowedDomain)
    private readonly domainRepository: Repository<AllowedDomain>,
    @InjectRepository(WhitelistedEmail)
    private readonly emailRepository: Repository<WhitelistedEmail>,
  ) {}

  // Refuses a sign-up that the lists do not allow
  async checkSignUp(email: string): Promise<void> {
    const [domains, emails] = await Promise.all([
      this.findDomains(),
      this.findEmails(),
    ]);
    const allowed = isSignUpAllowed(
      email,
      domains.map(({ domain }) => domain),
      emails.map((row) => row.email),
    );
    if (!allowed) {
      throw new ForbiddenException(SignUpDeniedMessage);
    }
  }

  async findDomains(): Promise<AllowedDomain[]> {
    return await this.domainRepository.find({ order: { domain: 'ASC' } });
  }

  async createDomain(domain: string): Promise<AllowedDomain> {
    return await this.saveDomain(this.domainRepository.create(), domain);
  }

  async updateDomain(id: string, domain: string): Promise<AllowedDomain> {
    return await this.saveDomain(await this.findDomain(id), domain);
  }

  async removeDomain(id: string): Promise<void> {
    const result = await this.domainRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Domain not found');
    }
  }

  async findEmails(): Promise<WhitelistedEmail[]> {
    return await this.emailRepository.find({ order: { email: 'ASC' } });
  }

  async createEmail(email: string): Promise<WhitelistedEmail> {
    return await this.saveEmail(this.emailRepository.create(), email);
  }

  async updateEmail(id: string, email: string): Promise<WhitelistedEmail> {
    return await this.saveEmail(await this.findEmail(id), email);
  }

  async removeEmail(id: string): Promise<void> {
    const result = await this.emailRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Email address not found');
    }
  }

  private async findDomain(id: string): Promise<AllowedDomain> {
    const row = await this.domainRepository.findOneBy({ id });
    if (!row) {
      throw new NotFoundException('Domain not found');
    }
    return row;
  }

  private async findEmail(id: string): Promise<WhitelistedEmail> {
    const row = await this.emailRepository.findOneBy({ id });
    if (!row) {
      throw new NotFoundException('Email address not found');
    }
    return row;
  }

  private async saveDomain(
    row: AllowedDomain,
    domain: string,
  ): Promise<AllowedDomain> {
    row.domain = normalizeDomain(domain);
    try {
      return await this.domainRepository.save(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('The domain is already listed');
      }
      throw error;
    }
  }

  private async saveEmail(
    row: WhitelistedEmail,
    email: string,
  ): Promise<WhitelistedEmail> {
    row.email = normalizeEmail(email);
    try {
      return await this.emailRepository.save(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('The address is already listed');
      }
      throw error;
    }
  }
}
