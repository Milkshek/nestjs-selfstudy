import type { User } from '../../user.js';

export class UserOutputDto {
  id: number;
  email: string;
  role: User['role'];

  static hydrate(user: User): UserOutputDto {
    const output = new UserOutputDto();

    output.id = user.id;
    output.email = user.email;
    output.role = user.role;

    return output;
  }
}
