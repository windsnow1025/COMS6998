import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { UsersCoreService } from '../users/users.core.service';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AccessModule],
  providers: [UsersCoreService],
  exports: [UsersCoreService],
})
export class CoreModule {}
