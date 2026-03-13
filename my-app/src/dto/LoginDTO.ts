export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponseDTO {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: AuthTokensDTO;
}
