import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { UsersCoreService } from '../users/users.core.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersCoreService],
  exports: [UsersCoreService],
})
export class CoreModule {}
