import showdown from "showdown";
import {
  gpt2Encode as encode,
  gpt2Decode as decode,
} from "gpt-3-encoder-browser";
import { UserModel, User } from "@/models/UserModel";
import { Email } from "@/services/types";
import { NodeMailgun } from "ts-mailgun";
import { v4 as uuidv4 } from "uuid";
import { Configuration, CreateChatCompletionResponse, OpenAIApi } from "openai";

const mailer = new NodeMailgun();
mailer.apiKey = process.env.MAILGUN_KEY;
mailer.domain = process.env.MAILGUN_DOMAIN;
mailer.fromEmail = process.env.MAILGUN_EMAIL;
mailer.fromTitle = "Helper";
mailer.unsubscribeLink = false;
mailer.init();

async function upsertUser(user: Partial<User>) {
  const existingUser = await UserModel.get(user.email).catch(() => null);

  try {
    let result: User;
    if (existingUser) {
      result = await UserModel.update(user.id, user);
    } else {
      result = await UserModel.create({
        ...user,
        id: uuidv4(),
      });
    }

    return result;
  } catch (error) {
    console.error("[upsertUser]", error);
    return null;
  }
}

async function getUserByEmail(email?: string) {
  if (!email) {
    return null;
  }

  try {
    return (await UserModel.query("email").eq(email).exec())[0];
  } catch (error) {
    console.error("[getUserByEmail]", error);
    return null;
  }
}

async function getUserById(id?: string) {
  if (!id) {
    return null;
  }

  try {
    return await UserModel.get({ id });
  } catch (error) {
    console.error("[getUserById]", error);
    return null;
  }
}

async function sendWelcomeEmail(email: Email) {
  try {
    await mailer.send(
      email.fromAddress,
      "Welcome to Helper",
      `<p>Respond to this email with your <a href="https://beta.openai.com/account/api-keys" target="_blank">OpenAI API Key</a> to get started.</p>`,
      {},
      {
        "h:In-Reply-To": email.messageId,
        "h:references": (
          email.messageId ??
          "" + " " + email.references ??
          ""
        ).trim(),
      }
    );
  } catch (error) {
    console.error("[sendWelcomeEmail]", error);
  }
}

async function sendActivationSuccessEmail(user: User, email: Email) {
  try {
    await mailer.send(
      user.email,
      `Re: ${email.subject}`,
      "<p>Got it!</p><p>Now you can start forwarding emails to me with prompts.</p>",
      {},
      {
        "h:In-Reply-To": email.messageId,
        "h:references": (
          email.messageId ??
          "" + " " + email.references ??
          ""
        ).trim(),
      }
    );
  } catch (error) {
    console.error("[sendActivationSuccessEmail]", error);
  }
}

function fitToTokens(text: string, maxTokens: number) {
  const tokens = encode(text);

  if (tokens.length <= maxTokens) {
    return text;
  }

  const truncated = tokens.slice(0, maxTokens);

  return decode(truncated);
}

async function sendPromptResponse(user: User, email: Email) {
  try {
    console.log("[sendPromptResponse] started for:", user.name);

    const configuration = new Configuration({
      apiKey: user.key,
    });

    const openai = new OpenAIApi(configuration);

    const response = await openai
      .createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful email assistant (Helper <ask@helper.email>). You respond to emails from the user.",
          },
          {
            role: "user",
            content: fitToTokens(email.body, 2048).trim(),
          },
        ],
        max_tokens: 1024,
      })
      .catch((error) => ({ error: error as Error }));

    const error = (response as { error: Error } | undefined)?.error;
    const completion = (response as any)?.data as CreateChatCompletionResponse;

    console.log("[sendPromptResponse] usage:", completion?.usage);
    console.log("[sendPromptResponse] error:", error?.message);

    const converter = new showdown.Converter();
    const text =
      completion?.choices?.[0]?.message?.content ??
      `# Oops :(\n\n${error?.message}`;
    const html = converter.makeHtml(text);

    await mailer.send(
      user.email,
      `Re: ${email.subject}`,
      html,
      {},
      {
        "h:In-Reply-To": email.messageId,
        "h:references": (
          email.messageId ??
          "" + " " + email.references ??
          ""
        ).trim(),
      }
    );
  } catch (error) {
    console.error("[sendPromptResponse] catch:", error);
  }
}

export const services = {
  sendWelcomeEmail,
  sendActivationSuccessEmail,
  sendPromptResponse,
  getUserById,
  getUserByEmail,
  upsertUser,
} as const;
