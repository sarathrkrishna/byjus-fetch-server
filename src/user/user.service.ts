import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AccountService } from "src/account/account.service";
import { AccountUserMasterService } from "src/account_user_master/acccount.user.master.service";
import {
  CreateUserDto,
  DeleteUserAccountDto,
  DeleteUserDto,
  UpdateUserDto,
  UserAccUpdateDto,
} from "./dto/user.dto";
import { User, UserDocument } from "./user.schema";
import * as randomstring from "randomstring";
import { ObjectId } from "src/shared/dtos/mongo.dto";

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

    await this.accountService.syncDbAccountsToLocal();

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

  async updateUserDetails(user: UpdateUserDto) {
    const { username } = user;
    const [existingUser] = await this.findUser({
      username,
    });
    if (!existingUser) {
      throw new ConflictException("User does not exit");
    }
    await this.updateUserByUsername(user);
    return (await this.findUser({ username }))[0];
  }

  async updateUserAccounts(body: UserAccUpdateDto) {
    const {
      user: { username, password },
      accounts,
    } = body;

    const [user] = await this.findUser({ username, password });

    if (!user) {
      throw new ConflictException("No user match.");
    }

    const accountsList = await this.fetchUserAccounts(user._id);

    if (!accountsList) {
      throw new ConflictException("No accounts linked to this user");
    }

    for (const acc of accounts) {
      const existingAcc = accountsList.find((a) => a.username === acc.username);
      if (existingAcc) {
        // existing, hence update
        await this.accountService.updateOneAccount(existingAcc._id, {
          password: acc.password,
          fullName: acc.fullName,
          nickName: acc.nickName,
        });
      } else {
        // no existant, hence create
        const [newAcc] = await this.accountService.createMultipleAccounts([
          {
            username: acc.username,
            fullName: acc.fullName,
            nickName: acc.nickName,
            password: acc.password,
            disableTill: 0,
            fetchEnabled: false,
          },
        ]);

        await this.accountUserMasterService.createMultipleAccountUserMasters([
          {
            userId: user._id,
            accountId: newAcc._id,
          },
        ]);
      }
    }

    await this.accountService.syncDbAccountsToLocal();

    return {
      accounts: await this.fetchUserAccounts(user._id),
    };
  }

  async deleteUserAccounts(body: DeleteUserAccountDto) {
    const {
      user: { username, password },
      accountNicknames,
    } = body;

    const [user] = await this.findUser({ username, password });
    if (!user) {
      throw new ConflictException("No user match.");
    }
    const accountList = await this.fetchUserAccounts(user._id);
    if (!accountList) {
      throw new ConflictException("No accounts linked to this user");
    }

    const deletedAccounts = await Promise.all(
      accountNicknames.map(async (nickName) => {
        const account = accountList.find((a) => a.nickName === nickName);

        if (!account) {
          return;
        }

        await this.accountService.deleteOneAccount({
          _id: account._id,
        });

        await this.accountUserMasterService.deleteOneAccountUserMaster({
          accountId: account._id,
        });

        return account;
      })
    );

    await this.accountService.syncDbAccountsToLocal();

    return deletedAccounts;
  }

  async deleteUser(body: DeleteUserDto) {
    const { username, password } = body;

    const [user] = await this.findUser({
      username,
      password,
    });
    if (!user) {
      throw new ConflictException("No user match.");
    }

    // do not delete the accounts that are linked to others as well

    const accUsrMaster =
      await this.accountUserMasterService.findAccountUserMasters({
        userId: user._id,
      });

    for (const aum of accUsrMaster) {
      const nonUserAum =
        await this.accountUserMasterService.findAccountUserMastersNotUser(
          aum.accountId,
          aum.userId
        );

      if (nonUserAum.length) {
        continue;
      }
      await this.accountService.deleteOneAccount({
        _id: aum.accountId,
      });
    }

    await this.accountUserMasterService.deleteManyAccountUserMaster({
      userId: user._id,
    });

    await this.accountService.syncDbAccountsToLocal();

    return await this.deleteOneUser({
      _id: user._id,
    });
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
  deleteOneUser(doc: User) {
    return this.userModel.deleteOne(doc);
  }
  updateUserByUsername(doc: User) {
    return this.userModel
      .findOneAndUpdate(
        { username: doc.username },
        {
          password: doc.password,
          fullName: doc.fullName,
          email: doc.email,
          qid: doc.qid,
        }
      )
      .exec();
  }

  async fetchUserAccounts(userId: ObjectId) {
    return await Promise.all(
      (
        await this.accountUserMasterService.findAccountUserMasters({
          userId: userId,
        })
      ).map(
        async (aum) =>
          (
            await this.accountService.findAccounts({ _id: aum.accountId })
          )[0]
      )
    );
  }
}
