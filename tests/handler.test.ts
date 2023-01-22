import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import * as handler from "@/handler";

test("hello", async () => {
  const event = { body: "Test Body" } as APIGatewayEvent;
  const context = {} as Context;

  const response = (await handler.incoming(
    event,
    context,
    () => null
  )) as APIGatewayProxyResult;

  expect(response.statusCode).toEqual(200);
  expect(typeof response.body).toBe("string");
});
