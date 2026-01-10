# Skyteller

![Screenshot 2023-06-13 at 9.39.31 AM.png](Skyteller/Screenshot_2023-06-13_at_9.39.31_AM.png)

## Product Description

- Converting digital assets into spendable fiat is tedious, risky and costly.
- How might we empower crypto natives and the crypto curious alike with a straightforward – and secure – solution to funds out?
- Build an easy and **simple** funds out solution that allows users to receive tokens in a personalized router contract that swaps and routes fiat to their connected bank account.

By “giving their bank account an on-chain address,” a user can:

- send USD to a connected bank account from any accepted token in their connected self-custodial wallet, from the Skyteller dApp.
- Give Bob their router address so that Bob can send their router crypto directly from his wallet.
- Give anyone a personalized `Pay me` URL so that Bob can pay them from a dApp interface.

## Technical Info

- TBD

Screenshots

![Screenshot 2023-06-13 at 9.40.23 AM.png](Skyteller/Screenshot_2023-06-13_at_9.40.23_AM.png)

![Screenshot 2023-06-13 at 9.39.55 AM.png](Skyteller/Screenshot_2023-06-13_at_9.39.55_AM.png)

![Screenshot 2023-06-13 at 9.40.03 AM.png](Skyteller/Screenshot_2023-06-13_at_9.40.03_AM.png)

![Screenshot 2023-06-13 at 9.40.05 AM.png](Skyteller/Screenshot_2023-06-13_at_9.40.05_AM.png)

![Screenshot 2023-06-13 at 9.40.07 AM.png](Skyteller/Screenshot_2023-06-13_at_9.40.07_AM.png)

## External Resources

- [Defiant article](https://thedefiant.io/off-ramp-crypto-in-one-click-with-skyteller)
- [BFF article](https://www.mybff.com/discover/this-founding-bff-and-her-team-are-making-crypto-offramp-seamless)

# Original Product Brief

## User Problem

Converting digital assets into spendable fiat is tedious, risky and costly.

How might we empower crypto natives and the crypto curious alike with a straightforward – and secure – solution to funds out?

## Context

### *Current Crypto > Fiat Path*

While many apps have made purchasing ****crypto (aka “funds in”) incredibly simple, converting your crypto into spendable fiat has always been a multi-step – and often costly – process.

A lot can go wrong in the multiple, fee-filled hops across exchanges, chains and wallets required to get your funds into a spendable form. Users can fat finger, exchanges can shut down, centralized wallets that connect to tradfi rails can go out of business. Over the past few months, those risks have become even more apparent as many crypto companies crumble – taking customers’ funds and the entire industry with them.

For crypto workers – many of whom are freelancers in developing, but volatile and inflationary, economies – those risks are more than just inconveniences; they’re potentially life-altering and devastating.

### Still Here, Still Building

In spite of the current headwinds – and perhaps even inspired by them – we believe this is a problem that is still worth solving and worth solving with urgency. Our mission – to build a straightforward and secure solution to funds out – remains as steady as it’s ever been. Yes, the current landscape is gloomy, but the potential is bigger than ever before.

Similarly, our geographic focus remains the same: we will start in the U.S., but use partners and solutions that will be able to scale globally immediately.

## Goals and Success Metrics

1. Empower users to quickly and seamlessly off ramp their digital assets into fiat.
    
    Success Metric: Monthly active users
    
    Success Metric: Transaction volume
    
    Success Metric: User retention
    
2. Deliver the smoothest, most trustworthy onboarding experience of any crypto-enabled dApp anywhere.

Success Metric: Onboarding conversion + KYC acceptance rates

Success Metric: Onboarding > transaction conversion

1. Identify additional product and business opportunities that will increase user engagement.
    
    Success Metric: Deep understanding of user problems, acquisition paths and engagement levers.
    

## Proposed Solution

Build an easy and **simple** funds out solution that allows users to receive tokens in a personalized router contract that swaps and routes fiat to their connected bank account.

By “giving their bank account an on-chain address,” a user can:

- send USD to a connected bank account from any accepted token in their connected self-custodial wallet, from the Skyteller dApp.
- Give Bob their router address so that Bob can send their router crypto directly from his wallet.
- Give anyone a personalized `Pay me` URL so that Bob can pay them from a dApp interface.

The product will:

- Require users to connect a `send from` non-custodial wallet to the Skyteller dApp a `send to` bank account (via Plaid) to the Skyteller dApp.
- Regularly swap and sweep tokens from the router into our swap provider (Bridge)
- Use our swap provider to swap USDC into fiat and route the funds to the appropriate destination bank account.
- Communicate the transaction’s status back to the user in the dApp.

A simple off-ramp solution does three important things:

1. Allows us to solve an urgent problem in a simple, easy-to-understand way that aligns well with our existing vision and mission.

2. Creates a fly trap for new users who we can build a relationship with over time.

3. Lays the foundation for a multitude of new products: bill pay, P2P and, yes, a debit card (and much more). It is the natural precursor to a full suite of financial products.

### Pricing

At initial launch we will offer the following tiered pricing:

- For the first transaction under $100, the user will not be charged a fee.
- Thereafter, users will be charged a 2% fee.
- Any entity that calls the sweep function will be assessed gas fees.

In the future, we may combine this with a subscription and/or membership fee.

## Supported Use Cases At a high level, we will do the following:

- Progressively onboard potential users from landing page to first transaction, re-using pieces of our existing signup and onboarding flow (SiWE, KYC checks, risk checks, allowance approval).
- Use Chain Watcher, our risk engine and any affiliated partners (TRM, etc.) to assess user risk on an ongoing basis across both their connected wallet and the router(s) they create.
- Require users to connect the Skyteller dApp to at least one bank account using Plaid.
- In the dApp: Allow users to specify an amount of stable coins to offramp from their connected wallet to a connected bank account.
- Swap any crypto in our user’s router into USDC once a sweep is called.
- Use our swap partner Bridge’s off-ramp feature, which swaps a set amount of stablecoin into USD and sends it to a bank account in the user’s name.
- Re-use our existing Skyteller branding.

### Sign-Up + Onboarding

- Users will connect their wallets via SiWE.
- Users will KYC during signup.
- Users’ identities can be verified, unverified or put in a pending state. Users in a pending state can submit supporting documentation to verify their identity.
- Users must connect their bank account via Plaid to off-ramp funds.
- *Risk Assessment:* When a user initially connects their wallet to Skyteller, the Chain Watcher will start monitoring all the user’s on-chain transactions. Those on-chain transactions will be used to generate a risk score for that user that may be leveraged at any time that is useful to Skyteller, including at transaction time or asynchronously.
- Users will create a router with an ENS name that they can specify. By creating this router, they will also receive a unique URL that other wallets can use to send their routers coins.

### The Router

- **What It Is:** The Skyteller router is a smartcontract with an address and ENS domain name (settable in the Skyteller dApp) that will swap crypto into USDC whenever the `Sweep` function is called. The resulting USDC is then sent downstream to additional providers who push USD into a user’s bank account.
- **Receiving Funds from the User’s Wallet:** Funds can be debited from the user’s wallet and pushed to their bank account in two ways: by initiating an off-ramp transaction from the dApp or by sending funds from their wallet directly to their router.
    
    In the dApp, when a transaction is initiated, the following actions and money movement takes place:
    
    - User specifies in the dApp the amount of crypto they want to move and the destination bank account.
    - If enough stablecoin is available in the user’s wallet AND the user’s risk score has not dropped below a certain threshold, Skyteller approves the transaction and initiates a swap of the token into USDC.
    - The resulting USDC is sent to user’s address in the swap partner.
    - The swap partner swaps the USDC into USD.
    - The USD is placed into the swap partner’s FBO account for the user.
    - The funds are transferred to the user’s bank account.
- **Receiving Funds from Another Wallet: Funds can be sent from another wallet to a user’s Skyteller router in two ways: by initiating a transaction from the user’s personalized `Pay me` URL or by sending funds from their wallet directly to the router.**

On the user’s personalized `Pay me` URL, any user can connect their wallet and initiate a transaction. When a transaction is initiated, the following actions and money movement takes place:

- User specifies on the `Pay me` page the amount of crypto they want to move and the destination bank account.
- If enough crypto is available in the user’s wallet, Skyteller approves the transaction and initiates transfer for the correct amount in crypto from the user’s wallet to the Skyteller user’s router.
- The router then swaps the transferred funds into USDC and sends the the USDC to the swap partner.
- The swap partner swaps the funds into USD.
- The USD is placed into the swap partner’s FBO account for the user.
- The funds are transferred to the user’s bank account.
- Users can see the lifecycle of all transactions, including on-chain wallet debits and settlement flows, in the transaction section of the dApp.
- Users can remove the connection to their bank account.

### User Communications

User can choose to receive notifications about their account and transactions in the following instances:

- **Signup:** Welcome to Skyteller.
- **Off-ramp initiated:** You have initiated a transaction.
- **Funds received:** Your router has received funds.
- **Funds available in bank:** Your funds are available in your bank account.
- **KYC pending:** We need more information about you to verify your identity.
- **Bank account connection:** You’ve connected your bank account.
- **Router update:** Your router has been updated.
- **Account closure:** Your account has been closed.

### Customer Support

- Users can access an FAQ page on the dApp in a logged in and logged out state.
- Users will access our support team during staffed hours via Intercom.

## Milestones

See the [project plan](https://docs.google.com/spreadsheets/d/1pbU-3PypXDKpgWAS-EvDZlnKv7-xLU8z1PNhRlRskSQ/edit?pli=1#gid=0).

## How Does It Fail?

1. Not an attractive product for users.
2. Hard to get them onboarded. KYC scares people.
3. **Not differentiated from Coinbase.**
4. Transaction fees + volume don’t make a big enough business.

## Open Questions

1. How will we price this product?
2. How will we collect fees?
3. How soon can we support international use cases?
4. How quickly can we launch this?
    
    A: Goal is to have this in market by 4/1
    
5. In future iterations, can we support more than collateralized stables?
    
    A: We will attempt to support a limited subset of tokens (even beyond stablecoin) out of the gate.
    
6. Can we support accounts that are not named? Aka ACH out for bill pay, mortgage, P2P.
    
    A: Likely, yes, but we will not do that for MVP.
    
7. Will we support recurring transfers? (i.e., every two weeks transfer X amount from my wallet to my bank account, at certain balance thresholds.)
    
    Yes, but not for MVP.
    
8. Will we support “scheduled” payments?
    
    Yes, but not for MVP.
    
9. Can this be integrated with streaming providers?
    
    Yes, but not for MVP.
    
10. How expensive is it to use Plaid?
    
    Plaid’s pay-as-you-go product is $1.50/initial call to use its [`Auth` product](https://plaid.com/docs/auth/#auth-integration-process) with $500 monthly credit for the first 6 months. Enterprise plans could likely get better pricing with bigger volume (+ minimums). Of note, Plaid connections can get disconnected, which require reconnections and additional calls. (TLDR: This can get expensive.) Bridge *may* take on the expense of Plaid checks. Discussion with Bridge TBD.
    
11. Will this work with all banks or only crypto friendly banks?
    
    This will work with all banks. The user’s bank account will be receiving fiat, not crypto.
    
12. How soon would we need to build a native app?
    
    Very soon.
    
13. Are there any circumstances under which money would flow back through to the user's wallet? (Transaction failure for some reason?) What happens if your bank account doesn't accept the funds for some reason? (Is this even possible?)
14. SLAs? Could there be an assurance/promise of hitting a certain time frame or you get a certain percentage back?

## Documentation

- [Bridge docs + sandbox](https://apidocs.bridge.xyz/docs/sandbox)
- [Sequence Diagrams](https://www.figma.com/file/6UCaZpopEqddsZ44Sn8ovC/Simple-Off-Ramp?t=B8cqwjElXo8KMv7c-0)
- [Funds Out Competitors](https://docs.google.com/spreadsheets/d/12UWh06W5WIDUWY4M44xWwCY28vnmGKi0ZI5rFtub4FM/edit#gid=1192617172)
- [Onboarding Ideas](https://www.figma.com/file/N0gda2WWINaJMlSxFU9D30/Onboarding-Ideas!?t=ljRznZrR4P1VLmqV-0)
- [Off-ramp Widget](https://www.figma.com/file/6SUkVLqKcXJo8j4MzCnZS8/off-ramp-widget?t=ljRznZrR4P1VLmqV-0)
- [Competitor Design Inspo!](https://www.figma.com/file/ABbD8jjpjY4p9qMZJWryez/Simple-Funds-Out-Design-Insp?t=7d5xKfwj3jiqUj3H-0)
- [SmartContract Documentation](https://hackmd.io/l_j1Zx_sRBGvGORcrUiv-w)

## Appendix

### Crypto *Workers + Stablecoin Use*

In light of a volatile market and industry, many crypto workers and companies that cater to them have told us the same thing again and again – they prefer to be paid in USDC because of its stability.

According to the CEO of [Bitwage](https://www.bitwage.com/), a 10-year-old company that works with employers and employees to pay workers in crypto, USDC is more popular with workers outside of the U.S., particularly in economies like Argentina and Nigeria.

USDC is the most popular stablecoin and [stablecoin volume itself remains robust](https://chapterone.substack.com/p/stablecoin-volumes-now-exceed-mastercard), even in light of volatility in other parts of the market.

### Existing Offramp Competitors in the Space

Spritz

- [https://help.spritz.finance/en/articles/6753624-how-do-spritz-fees-work](https://help.spritz.finance/en/articles/6753624-how-do-spritz-fees-work)
- [https://www.spritz.finance/blog/announcing-spritz-off-ramp-crypto-to-usd-bank-transfer](https://www.spritz.finance/blog/announcing-spritz-off-ramp-crypto-to-usd-bank-transfer)

Ramp

- [https://landing.ramp.network/off-ramp](https://landing.ramp.network/off-ramp)
- [https://www.youtube.com/watch?v=BXU-DvP2sEk](https://www.youtube.com/watch?v=BXU-DvP2sEk)
- [https://www.youtube.com/watch?v=5Ep7EGb6OUQ](https://www.youtube.com/watch?v=5Ep7EGb6OUQ)
- [https://support.ramp.network/en/articles/8992-what-payout-options-does-ramp-offer-for-selling-crypto](https://support.ramp.network/en/articles/8992-what-payout-options-does-ramp-offer-for-selling-crypto)

Fluid Finance (based in Switzerland)

- [https://www.tiktok.com/@fluid_fi/video/7174389127201246470?is_from_webapp=1](https://www.tiktok.com/@fluid_fi/video/7174389127201246470?is_from_webapp=1)