import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { RequestWithOptionalUser } from '../../auth/interfaces/request-with-optional-user.interface';
import { AppConfig } from '../../config/config.interface';
import { UsersCoreService } from '../../users/users.core.service';

// For public endpoints whose response depends on the viewer:
// a valid token attaches the user, and any other request stays anonymous.
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private readonly config: AppConfig;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersCoreService: UsersCoreService,
  ) {
    this.config = this.configService.get<AppConfig>('app')!;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      return true;
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.jwtSecret,
      });
    } catch {
      return true;
    }

    const user = await this.usersCoreService.findOneById(parseInt(payload.sub));
    if (user && payload.tokenVersion === user.tokenVersion) {
      (request as RequestWithOptionalUser).user =
        this.usersCoreService.toUserDto(user);
    }
    return true;
  }
}
