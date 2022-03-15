export class UserDto {
  username: string;
  password: string;
  fullName: string;
  email: string;
}
export class AccountsDto {
  username: string;
  fullName: string;
  nickName: string;
  password: string;
}
export class CreateUserDto {
  user: UserDto;
  accounts: AccountsDto[];
}

export class UpdateUserDto extends UserDto {
  qid: string;
}

export class UserAccUpdateDto extends CreateUserDto {}

export class DeleteUserAccountDto {
  user: {
    username: string;
    password: string;
  };
  accountNicknames: string[];
}

export class DeleteUserDto {
  username: string;
  password: string;
}
