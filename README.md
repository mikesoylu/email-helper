# `@helper.email`

Chat with GPT via email.

### Requirements

- [Install the Serverless Framework](https://serverless.com/framework/docs/providers/aws/guide/installation/)
- [Configure your AWS CLI](https://serverless.com/framework/docs/providers/aws/guide/credentials/)
- Connect your domain (`HOSTED_ZONE_NAME`) to [AWS Route 53](https://console.aws.amazon.com/route53) and issue your ACM certificate for `API_DOMAIN` and `APP_DOMAIN` domains on [ACM](https://console.aws.amazon.com/acm)
- [Setup your Mailgun sending domain](https://documentation.mailgun.com/docs/mailgun/user-manual/get-started/) and create a "Store and notify" mail receiving route on address `MAILGUN_EMAIL` that points to `https:<API_DOMAIN>/incoming`
  Optional: Setup a local development route that points to your local tunnel address `https://<LOCALTUNNEL_SUBDOMAIN>.loca.lt/incoming`

### Environment Variables

To add environment variables to your project

1. Rename `env.example` to `.env`.
2. Set environment variables for your stage in `.env`.

### Installation

Install the npm packages

``` bash
$ npm install
```

Install local tunnel to test mail hooks on local environment

``` bash
$ npm install -g localtunnel
```

### Usage

To simulate API Gateway locally using [serverless-offline](https://github.com/dherault/serverless-offline)

``` bash
$ script/start
```

To deploy your project to production

``` bash
$ script/deploy
```

### Running Tests

Run your tests using

``` bash
$ npm test
```
