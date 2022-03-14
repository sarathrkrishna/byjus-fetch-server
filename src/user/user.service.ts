import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AccountService } from "src/account/account.service";
import { AccountUserMasterService } from "src/account_user_master/acccount.user.master.service";
import { CreateUserDto } from "./dto/user.dto";
import { User, UserDocument } from "./user.schema";
import * as randomstring from "randomstring";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly accountService: AccountService,
    private readonly accountUserMasterService: AccountUserMasterService
  ) {}

  async createUser(body: CreateUserDto) {
    const { user, accounts } = body;

    const existingUser = await this.userModel.find({ username: user.username });
    if (existingUser.length) {
      throw new ConflictException("User already exists, try another username");
    }

    const qid = randomstring.generate({
      length: 5,
      charset: "numeric",
    });

    const [newUser] = await this.createMultipleUsers([
      {
        username: user.username,
        password: user.password,
        qid,
        fullName: user.fullName,
        email: user.email,
      },
    ]);

    const accountsList = await Promise.all(
      accounts.map(async (acc) => {
        const [account] = await this.accountService.findAccounts({
          username: acc.username,
        });

        if (account) {
          return account;
        }

        return (
          await this.accountService.createMultipleAccounts([
            {
              username: acc.username,
              password: acc.password,
              fullName: acc.fullName,
              nickName: acc.nickName,
              disableTill: 0,
              fetchEnabled: false, // by default it is set to false
            },
          ])
        )[0];
      })
    );

    const accUsrMasterList = await Promise.all(
      accountsList.map(async (al) => {
        const [accUsrMaster] =
          await this.accountUserMasterService.findAccountUserMasters({
            userId: newUser._id,
            accountId: al._id,
          });

        if (accUsrMaster) {
          return;
        }

        const [newAccUsrMater] =
          await this.accountUserMasterService.createMultipleAccountUserMasters([
            {
              userId: newUser._id,
              accountId: al._id,
            },
          ]);
        return newAccUsrMater;
      })
    );

    return {
      user: newUser,
      accountsConnected: accUsrMasterList.map((aum) => {
        const acc = accountsList.find((al) => al._id === aum.accountId);
        return {
          _id: acc._id,
          username: acc.username,
          fullName: acc.fullName,
          nickName: acc.nickName,
        };
      }),
    };
  }
  findUser(doc: User) {
    return this.userModel.find(doc).exec();
  }
  createMultipleUsers(doc: User[]) {
    return this.userModel.create(doc);
  }
  updateUser(doc: User) {
    return this.userModel.findOneAndUpdate({ _id: doc._id }, doc).exec();
  }
}
