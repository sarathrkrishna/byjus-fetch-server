import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { AccountService } from 'src/account/account.service';

@Injectable()
export class TaskService {
  constructor(private readonly accountService: AccountService) {}
  @Timeout(1000)
  async justRun() {
    console.log('executed after one second');

    const data = (await this.accountService.findAllAccounts())[0];
  }
}
