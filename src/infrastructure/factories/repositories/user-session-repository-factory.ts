import { IUserSessionRepository } from "@domain/repositories/user-session.repository";
import { MongoDBUserSessionRepository } from "../../repositories/mongodb-user-session.repository";

export const makeUserSessionRepository = (): IUserSessionRepository => {
  return new MongoDBUserSessionRepository();
};

