# crmsync

This tree includes interfaces for Hubspot (module `hubspotjs`) and outreach.js (module `outreachjs`) and a tool for updating contacts in outreach.js based upon their status in Hubspot (module `hubspotoutreachbridge`). See source code for more information.

## Setup

## Hubspot

You will need to make a Hubspot key file. It contains a JSON dictionary with the `hapikey` from Hubspot as a string. It will look something like the following.

```
{"hapikey":"zmw498rj-fj84-cm29-9dk3-49vjfie20ac2"}
```

## Outreach

You will need to define an application key file and a session key file for Outreach. The application key file is static and includes `client_id`, `client_secret`, and `redirect_uri`, all as strings. The user key file comes from the result of an authentication transaction [as documented on the Outreach site](https://api.outreach.io/api/v2/docs).

```
https://api.outreach.io/oauth/authorize?client_id=<CLIENT_ID>&redirect_uri=<REDIRECT_URI>&response_type=code&scope=profile%20email%20create_prospects%20read_prospects%20update_prospects%20read_sequences%20update_sequences%20read_tags%20read_accounts%20create_accounts%20read_activities%20read_mailings%20read_mappings%20read_plugins%20read_users%20accounts.all%20accounts.read%20accounts.write%20accounts.delete%20callDispositions.all%20callDispositions.read%20callDispositions.write%20callDispositions.delete%20callPurposes.all%20callPurposes.read%20callPurposes.write%20callPurposes.delete%20calls.all%20calls.read%20calls.write%20calls.delete%20events.all%20events.read%20events.write%20events.delete%20mailings.all%20mailings.read%20mailings.write%20mailings.delete%20mailboxes.all%20mailboxes.read%20mailboxes.write%20mailboxes.delete%20personas.all%20personas.read%20personas.write%20personas.delete%20prospects.all%20prospects.read%20prospects.write%20prospects.delete%20sequenceStates.all%20sequenceStates.read%20sequenceStates.write%20sequenceStates.delete%20sequenceSteps.all%20sequenceSteps.read%20sequenceSteps.write%20sequenceSteps.delete%20sequences.all%20sequences.read%20sequences.write%20sequences.delete%20stages.all%20stages.read%20stages.write%20stages.delete%20taskPriorities.all%20taskPriorities.read%20taskPriorities.write%20taskPriorities.delete%20users.all%20users.read%20users.write%20users.delete%20tasks.all%20tasks.read%20tasks.write%20tasks.delete%20snippets.all%20snippets.read%20snippets.write%20snippets.delete%20templates.all%20templates.read%20templates.write%20templates.delete%20rulesets.all%20rulesets.read%20rulesets.write%20rulesets.delete%20sequenceTemplates.all%20sequenceTemplates.read%20sequenceTemplates.write%20sequenceTemplates.delete%0A

```

If the redirect URI is an actual endpoint, it will capture the code parameter in the query string. If it is a fake endpoint, you can get it from the address bar of your browser. Follow the instructions on the aforementioned documentation page to turn the code into a token (using a curl command). Convert the token to proper JSON.

## Invocation

In order to perform an operation, give the token locations, add appropriate throttling so as not to get blocked, enable writing, and specify the operation. The two main operations are "import" (which checks records recently updated in Outreach and updates the Outreach records from Hubspot) and "campaign" (which checks records recently updated in Hubspot and updates them in Outreach).

```
nodejs index.js --outreach-application /etc/hsorbridge/outreach-application.json --outreach-token /etc/hsorbridge/outreach-token.json --hubspot-token /etc/hsorbridge/hubspot-key.json --hubspot-queries-per-second 9 --outreach-queries-per-hour 4000 --write 1 --operation "campaign";
```

If time has passed and you want to refresh your Outreach token (before it expires), you can capture the new tokens with the `--outreach-token-new 1` option.

