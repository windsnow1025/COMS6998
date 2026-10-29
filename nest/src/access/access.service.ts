import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../common/utils/query-error';
import { AccessPolicy, SignUpPolicyId } from './access-policy.entity';
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

// Whether an address may create an account: any address while sign-up is not restricted; otherwise an address whose
// domain is listed, or an address listed itself, so that restriction with both lists empty admits nobody new
export function isSignUpAllowed(
  email: string,
  restricted: boolean,
  domains: string[],
  emails: string[],
): boolean {
  if (!restricted) {
    return true;
  }
  const normalized = normalizeEmail(email);
  const domain = normalized.slice(normalized.lastIndexOf('@') + 1);
  return domains.includes(domain) || emails.includes(normalized);
}

@Injectable()
export class AccessService implements OnModuleInit {
  constructor(
    @InjectRepository(AllowedDomain)
    private readonly domainRepository: Repository<AllowedDomain>,
    @InjectRepository(WhitelistedEmail)
    private readonly emailRepository: Repository<WhitelistedEmail>,
    @InjectRepository(AccessPolicy)
    private readonly policyRepository: Repository<AccessPolicy>,
  ) {}

  // Seeds the policy row, unrestricted, while the table lacks it
  async onModuleInit() {
    const exists = await this.policyRepository.existsBy({ id: SignUpPolicyId });
    if (!exists) {
      await this.policyRepository.save({
        id: SignUpPolicyId,
        restricted: false,
      });
    }
  }

  async findPolicy(): Promise<AccessPolicy> {
    const policy = await this.policyRepository.findOneBy({
      id: SignUpPolicyId,
    });
    if (!policy) {
      throw new Error('The sign-up policy row is missing');
    }
    return policy;
  }

  async updatePolicy(restricted: boolean): Promise<AccessPolicy> {
    const policy = await this.findPolicy();
    policy.restricted = restricted;
    return await this.policyRepository.save(policy);
  }

  // Refuses a sign-up that the policy and the lists do not allow
  async checkSignUp(email: string): Promise<void> {
    const [policy, domains, emails] = await Promise.all([
      this.findPolicy(),
      this.findDomains(),
      this.findEmails(),
    ]);
    const allowed = isSignUpAllowed(
      email,
      policy.restricted,
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
