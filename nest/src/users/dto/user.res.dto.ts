import { Role } from '../../common/enums/role.enum';

export class UserResDto {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  roles: Role[];
  avatar?: string;
  credit: number;
}
