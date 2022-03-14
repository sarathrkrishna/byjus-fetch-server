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
