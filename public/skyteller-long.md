# Skyteller - Crypto off-ramp

Product by Galactic, 2021–2023

# Context

Skyteller started as a dream to turn crypto into cash in just one click, and to make the whole crypto world more accessible and user-friendly. We built a bridge to your bank, allowing you to off-ramp straight from your wallet or your personal Skyteller off-ramp contract.

<aside>
💡 This is a design case study for the most part but fair warning that this product was highly technical.  I’ll explain key concepts where needed to understand the product.

</aside>

## Terms

In that intro alone there are several key concepts which probably need explaining.

| **Crypto** | Digital currency on the blockchain. Just including this one for completeness. |
| --- | --- |
| **Bridge** | Defi → Tradfi |
| **Off-ramp** | Get me out of crypto |
| **Wallet** | Where my crypto is |
| **Contract** | A ‘smart contract’ is a program stored on the blockchain that executes commands based on predetermined set of rules. This is one of the main concepts we’ll dig into.  |

## Product Overview

The core Skyteller product enabled people to connect their bank account and withdraw crypto — a simple A→B proposition, but with many layers of technical and product complexity.

While many apps have made purchasing crypto (aka “funds in”) incredibly simple, converting your crypto into spendable fiat has always been a multi-step – and often costly – process.

A lot can go wrong in the multiple, fee-filled hops across exchanges, chains and wallets required to get your funds into a spendable form. Users can fat finger, exchanges can shut down, centralized wallets that connect to tradfi rails can go out of business. Over the past few months, those risks have become even more apparent as many crypto companies crumble – taking customers’ funds and the entire industry with them.

For crypto workers – many of whom are freelancers in developing, but volatile and inflationary, economies – those risks are more than just inconveniences; they’re potentially life-altering and devastating.

We’re dealing with money here – real money – and that’s immediately sensitive. Top product concerns included:

- Transparency: How do we make sure they trust us?
- Identity: How do we know who to trust?
- On-going risk assessment: How do we continue to trust those users as they use our platform?

### Product landscape

At the time, Skyteller's differentiation came down to a few key points:

- **Non-custodial wallet:** We supported crypto wallets that users themselves were in full control. Platforms like Coinbase or Kraken are considered custodial because they are ultimately in control of the encryption that protects your data. We wanted to enable a decentralized, open experience for crypto users.
- Product

### Who are we building for?

- The Skyteller off-ramp was built for folks earning salaries or portions thereof in crypto. This could be artists selling NFTs or music on the blockchain, DAO (decentralized autonomous organization) contributors, or anyone that wants

User flows

- Waitlist: We gated the app with a waitlist that we controlled
- Sign up: Once off the waitlist, users could

### Identity

- KYC
- Chainwatcher

## Integrations

### React frontend

- Next.js to make it full stack and where our firebase webhooks would live)
Well supported 3rd party community, esp with some of the nascent web3 libraries we utilizied
- wagmi - react hooks for ethereum
- Rainbow Kit - customizable log in with ethereum experience

### Firebase backend

- Firestore for our datastore - Very scalable, intuitive data model (collections, sub collections, etc.)
- Functions

### External services

- Plaid: for connecting bank accounts
- Lithic: for card issuing and program management
- Persona: for KYC (Know Your Customer identity risk assessment)

### 3rd party libraries

- Wagmi - a collection of React Hooks containing everything you need to start working with Ethereum. Wagmi makes it easy to "Connect Wallet," display ENS and balance information, sign messages, interact with contracts, and much more — all with caching, request deduplication, and persistence.

### Homegrown services

We evaluated the standard for real-time risk assessments and said: that’s not good enough and then built something to solve that problem.

- Chain watcher - We had a set of standard services that didn’t work for us (look-back instead of real-time) but we figured out a way to get an updated real-time risk score by layering that product with a service
    - 

Rollout strategy

- Friends and family
- Waitlist
- Open the floodgates