# Security policy

## Supported versions

Security fixes are applied to the latest release on `main`.

## Reporting a vulnerability

Please do not open a public issue for security problems.

Use GitHub's **private vulnerability reporting** on this repository (Security → Report a vulnerability). Include:

- a description of the issue and its impact,
- steps to reproduce, with a sample file or input if relevant,
- the browser and version you tested.

We aim to acknowledge reports within a few days and to publish a fix and advisory once the issue is understood.

## Scope

In scope:

- Cross-site scripting or HTML injection through tool inputs or file names.
- Ways to make the app send user data to another origin.
- Weaknesses in the Content Security Policy.
- Incorrect randomness in password or UUID generation.
- Vulnerabilities in vendored libraries that are reachable through the app.

Out of scope:

- A pasted regular expression that is slow on certain input (the tester stops it after 1.5 seconds).
- JWT decoding without signature verification (documented behavior).
- Issues that require an already-compromised browser or device.

## Design notes

- No data leaves the browser. The Content Security Policy restricts all requests to the same origin.
- DOM content is created with text nodes. `innerHTML` is forbidden by lint rules.
- Randomness comes from `crypto.getRandomValues` with rejection sampling.
