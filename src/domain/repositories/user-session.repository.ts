import { UserSession } from "@domain/entities/user-session.entity";

export interface IUserSessionRepository {
  findByUserId(userId: string): Promise<UserSession | null>;
  save(session: UserSession): Promise<UserSession>;
  delete(userId: string): Promise<void>;
}

