import { Request } from 'express';
import { UserResDto } from '../../users/dto/user.res.dto';

export interface RequestWithOptionalUser extends Request {
  user?: UserResDto;
}
