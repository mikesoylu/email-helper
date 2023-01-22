import * as dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";

const schema = new dynamoose.Schema(
  {
    id: {
      type: String,
      hashKey: true,
    },
    email: {
      type: String,
      required: true,
      index: {
        rangeKey: "id",
      },
    },
    key: {
      type: String,
      required: true,
    },
    name: String,
  },
  {
    timestamps: true,
  }
);

export class User extends Item {
  id: string;
  email: string;
  name?: string;
  key: string;
}

export const UserModel = dynamoose.model<User>(
  process.env.usersTableName,
  schema,
  {
    create: true,
    throughput: "ON_DEMAND",
  }
);
