export class AuthenticationTokenOutputDto {
  accessToken: string;

  static hydrate(accessToken: string): AuthenticationTokenOutputDto {
    const output = new AuthenticationTokenOutputDto();

    output.accessToken = accessToken;

    return output;
  }
}
