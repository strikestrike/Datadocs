## Overview
There are 3 parts we need to setup to have the api running locally.

### 1. Api server
It is at https://github.com/datadocs/dd-internal-api-node, contains the application api for workspace, workbook/worksheet items.

On the server, we use Firebase to do Auth, Cloud spanner as main database. To get it setup locally, follow the instruction here https://github.com/datadocs/dd-internal-api-node/blob/main/README.md#locally-running

### 2. UI
This repo itself.

### 3. Splash
It is our splash site and main place to handle register/login, located at https://github.com/datadocs/splash.
Please follow the instruction in the readme file, it's pretty the same as in UI.

## Setup account
After you have all three parts above up and running, whenever you access the `UI` page at http://localhost:8080/ it will redirect to `Splash` page to do the login/register process (only redirect if you aren't logging in).

For the first time, you have to setup an account. There are some note:
- The api server will send a email to the email address you use (to verify the email). But on local, there will be a log message on `Api server` console for you to get the code. So it's fine if you enter an random email.
- We use Stripe for handling payment. you can use the test card `4242 4242 4242 4242` with any valid cvv and expiration date.
