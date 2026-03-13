// ─── CreateUserDTO ────────────────────────────────────────────────────────────
// The shape of the request body when registering a new user.

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  dateOfBirth?: string; // ISO date string, e.g. "1995-06-15"
  gender?: "male" | "female" | "non_binary" | "prefer_not_to_say";
}
