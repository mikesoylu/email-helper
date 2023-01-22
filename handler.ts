import { services } from "@/services";
import { Email } from "@/services/types";
import middy from "@middy/core";
import httpHeaderNormalizer from "@middy/http-header-normalizer";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpMultipartBodyParser from "@middy/http-multipart-body-parser";
import httpUrlencodeBodyParserMiddleware from "@middy/http-urlencode-body-parser";
import httpUrlencodePathParametersParserMiddleware from "@middy/http-urlencode-path-parser";
import { createHmac } from "crypto";

export const incoming = middy(async (event) => {
  const parsedEvent = (event as any).body;

  // Validate MG signature
  const value = parsedEvent.timestamp + parsedEvent.token;
  const hash = createHmac("sha256", Buffer.from(process.env.MAILGUN_SIGN_KEY))
    .update(value)
    .digest("hex");

  if (hash !== parsedEvent.signature) {
    console.log("[incoming] Invalid signature");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Invalid signature",
      }),
    };
  }

  const incomingEmail: Email = {
    messageId: parsedEvent["Message-Id"] as string,
    references: parsedEvent.References as string,
    fromAddress: parsedEvent.sender as string,
    from: parsedEvent.from as string,
    subject: parsedEvent.subject as string,
    to: parsedEvent.To as string,
    body: parsedEvent["body-plain"] as string,
  };

  const user = await services.getUserByEmail(incomingEmail.fromAddress);

  const apiKey = incomingEmail.body?.match(/sk-.*/)?.[0];

  if (!user && !apiKey) {
    await services.sendWelcomeEmail(incomingEmail);
  } else if (!user) {
    const newUser = await services.upsertUser({
      name: incomingEmail.from,
      email: incomingEmail.fromAddress,
      key: apiKey,
    });

    if (newUser) {
      await services.sendActivationSuccessEmail(newUser, incomingEmail);
    }
  } else {
    await services.sendPromptResponse(user, incomingEmail);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Success",
    }),
  };
});

incoming
  .use(httpHeaderNormalizer())
  .use(httpUrlencodePathParametersParserMiddleware())
  .use(httpUrlencodeBodyParserMiddleware())
  .use(httpJsonBodyParser())
  .use(httpMultipartBodyParser());
