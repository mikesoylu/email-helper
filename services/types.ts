export interface Email {
  to: string;
  from: string;
  fromAddress: string;
  subject: string;
  body: string;
  references?: string;
  messageId?: string;
}
