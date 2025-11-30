# Over-Engineered - “Daily Dispatch”

# Context

I have a workflow problem that I deal with on a daily basis. And as with most things, I’m wondering if I can over-engineer a solution to my problem.

Every morning, I open my phone and tackle my daily games:

- First, I open up the NYT Games app to complete [Wordle](https://www.nytimes.com/games/wordle/index.html), [Connections](https://www.nytimes.com/games/connections), and the [Mini Crossword.](https://www.nytimes.com/crosswords/game/mini)
- Then, I leave the app and head to the browser to complete the NYT’s new beta word puzzle game, [Strands](https://www.nytimes.com/games/strands).
- After that, it’s on to a separate app, [Coffee Golf](https://apps.apple.com/us/app/coffee-golf/id6449750555).

*Phew*.

<aside>
👉🏼 P.S. If you haven’t seen my first article where I reverse engineer one of my favorite word puzzle games, check it out! 

[Reverse Engineering - Connections by NYT](https://www.notion.so/Reverse-Engineering-Connections-by-NYT-b325a3ed84a14ddb90322887aa1cb7be?pvs=21)

</aside>

Now, here’s where the workflow problem comes in.

---

# Problem statement

***As a fan of games that I play with many friends, how can I make the repetitive process of sharing my scores a bit easier?***

If we rewind a little bit, I want to share my scores after completing each of these games with different subsets of friends and family via messages and WhatsApp.

Each game has a sharing mechanism that lets me send off an emoji-based message via whatever app I use for messaging.

![Sharing scores](Over-Engineered%20-%20%E2%80%9CDaily%20Dispatch%E2%80%9D/IMG_6841.png)

Sharing scores

![Apple Messages thread](Over-Engineered%20-%20%E2%80%9CDaily%20Dispatch%E2%80%9D/IMG_6840.png)

Apple Messages thread

![WhatsApp group](Over-Engineered%20-%20%E2%80%9CDaily%20Dispatch%E2%80%9D/IMG_6839.png)

WhatsApp group

**A quick aside**

This sharing mechanism (that I suppose Wordle popularized – check me on that) is actually an ingenious visual framework for socializing scores. It’s fun, lightweight, and viral.

As you saw in the screenshots above, each game utilize this mechanism in different and clever ways:

| Wordle 1,200 4/6
⬛️ ⬛️ ⬛️ ⬛️ ⬛️
⬛️ ⬛️ ⬛️ 🟩 🟨
🟩 ⬛️ ⬛️ 🟩 ⬛️
🟩 🟩 🟩 🟩 🟩 | Connections
Puzzle #342
🟨 🟨 🟨 🟨 
🟦 🟪 🟦 🟦 
🟦 🟦 🟪 🟦 
🟦 🟦 🟦 🟦 
🟩 🟩 🟩 🟩
🟪 🟪 🟪 🟪  | Strands #76
”Parts of the equation”
🟡 🔵 🔵 🔵
🔵 🔵 | Coffee Golf - May 18
8 Strokes - Top 1% 🏆

🟨 🟦 🟩 🟥 🟪
1️⃣ 2️⃣ 2️⃣ 1️⃣ 2️⃣ |
| --- | --- | --- | --- |

Now, let’s get back to the reason I need to solve this problem.

---

# Why solve this problem?

I’ve identified a repetitive task that detracts from the meaningful activities that bring me delight each day. Let’s talk about the operational burden this problem is contributing to:

![Screenshot 2024-05-18 at 11.08.33 PM.png](Over-Engineered%20-%20%E2%80%9CDaily%20Dispatch%E2%80%9D/Screenshot_2024-05-18_at_11.08.33_PM.png)

Using the modeling above with a sample of my workflow, let’s assume I’m spending 30 seconds per day sharing out these scores. That’s somewhat acceptable, if not inconvenient.

However… I’m only currently sharing my Wordle score with 3 groups, Connections result with 2 groups, and Coffee Golf with 1 group.

Imagine the chaos if Groups B and C take an interest in Coffee Golf.

### Other considerations

In addition to solving my **scaling** problem, I have another other key consideration:

- **Deliverability Reliability:** Sometimes I complete my games quite early in the morning and don’t want to send the scores right away. But, I can forget to send them later, so it’d be great if I had a backup that sends them at some point in the day if I haven’t.

---

# Possible solution

In my ideal scenario, I could complete each game, share the score once and then have the scores sent out to the relevant groups.

Comparing these two scenarios, you can see how an intermediary could help. Now, there are less lines that take 5 seconds. I’m looking at a 50% reduction of effort or a 100% gain in efficiency [[see appendix](https://www.notion.so/Over-Engineered-Daily-Dispatch-50afca922c22419981a167f097f8870a?pvs=21) for fun], depending on how your product marketing department wants to spin it.

![Current workflow](Over-Engineered%20-%20%E2%80%9CDaily%20Dispatch%E2%80%9D/Untitled.png)

Current workflow

![Improved workflow](Over-Engineered%20-%20%E2%80%9CDaily%20Dispatch%E2%80%9D/Untitled%201.png)

Improved workflow

## Considerations

Let’s consider the above approach. It generally accomplishes what I want but immediately sends scores. This is fine and effectively works as it does today… but the workflow can be faster.

### **Batching**

I don’t necessarily need to share my score as soon as I complete the game. In fact, it might be nice to only send the scores once all my games are complete and the respective scores are in.

### **Scheduling**

Related to the above, I might also not want the scores to send immediately after all scores are in. It might be nice to send them at a scheduled time, like around lunchtime.

---

# Product requirements

This means, my app can’t just shoot scores out willy-nilly. Given the points above, here is my final list of key product requirements:

1. I want to share my scores once, which magically sends those to WhatsApp or iMessage group chats.
2. But, I want those messages to be sent **when** I want them to be sent, effectively enabling the discretion I have when I send them manually.
3. And lastly, I need some way to manage who should get what messages and when.

---

# Implementation sketch

My app hinges on routing messages to multiple channels with protocols like SMS, MMS, and WhatsApp’s custom XMPP. Luckily, a service like [Twilio](https://www.twilio.com/docs/conversations) has APIs that can handle this for me. To utilize those APIs, here’s what I think I would need to build:

### Considerations

- This is a low volume application, it’s just for one user (for now)
- I’ll need to store scores and then send them when I want
- I’ll need a UI to determine when to do the above mentioned thing
    - I’ll need to put this app behind some simple authentication so its not publicly available

### Drawbacks of this approach

- My understanding with something like Twilio is that I’ll be taking on a new phone number. This disrupts my established messaging threads and is slightly disruptive unless I can spin the benefit to my external customers (friends and family).

### Tech stack

- React, with a framework like Next.js to make it full-stack
- Twilio’s Conversations* API
- [BullMQ](https://bullmq.io/) for job queuing
- Redis** for my database
- Render or Vercel or Google Cloud***, for hosting

<aside>
🤔 * I’m not sure which of Twilio’s APIs would be best here, but after some quick scanning, this seems like the place to start. Further diving in required.

** Redis with BullMQ seems like a reasonable choice to include after a quick read of this article: [https://medium.com/@asanka_l/integrating-bullmq-with-nextjs-typescript-f41cca347ef8](https://medium.com/@asanka_l/integrating-bullmq-with-nextjs-typescript-f41cca347ef8)

*** I’ve used all of these hosts for different apps, but can’t articulate off the top of my head the trade-offs between the services. I would have to dig into this more as well.

</aside>

### Admin workflow

Before I share scores, I need to use my new app to configure some rules:

1. Scores*: An expectation of what scores it should be looking for
2. Scheduling: A time for when it should send scores when all of them are in
    1. A threshold for when to send messages even if all my scores aren’t in
3. Contacts: I need to define who gets what and when, that needs to be stored somewhere

<aside>
💡 * I need some way to know which scores are for what game so I can display them in the UI. That’s pretty easy because each message has the name of the game in it. I can write some logic to infer the game of origin and then use that data for displaying everything appropriately in the UI (you’ll see in the prototype).

OR, I can create and train my own Large Language Model #LLM to handle this for me and automatically recognize new games in the future. Just kidding. I think.

</aside>

### Sharing workflow

In the ‘golden path’ of this workflow, I send my scores and the app automatically blasts the text out to my friends and family.

1. I complete my games as usual and share my scores, but this time I only share once
2. My web app will catch incoming messages from Twilio and store them in my database. Based on the rules I set up in the admin, it will:
    1. Display if scores were received and sent
    2. Provide me with overrides in case I want to interrupt the automatic workflow
    3. Follow some rules to send out my scores if I don’t override anything

### System diagram

Please keep in mind that while I am fairly technical, I have not spent a lot of actual time drawing up system architecture 😂. But, I think it’s important to at least have a little understanding of the components of modern app architecture, so I’m visualizing something hopefully more than a little hand-wavy. Given all that, building this app could look something like this:

![Untitled](Over-Engineered%20-%20%E2%80%9CDaily%20Dispatch%E2%80%9D/Untitled%202.png)

# Prototype preview (WIP)

It wouldn’t be over-engineering without adding a little extra effort to visualize this solution. For this article I’ll only show a preview of the hypothetical app interface I’m building.

You’ll have to imagine the workflow begins as it normally does, from a share sheet within each app. Instead of sharing to my groups one by one, I share it once per app to my new service which collects them and keeps them ready to send all at once, when I need.

### **TODOs**

There are a handful of things to continue to build out and consider, this is how I’d prioritize that list:

- **[Priority Zero] Add login** - I need to add authentication because this app will be using my personal Twilio credentials. Even though there’s not a whole lot that can be done with the functionality here, it’s best that I add this in before I add any controls in.
- **[Priority 1] Add controls for managing contacts/groups and scheduling** - This is core functionality
- **[Priority 2] Add states for sent scores** - I need some feedback in the UI to report things are working as expected
- **[Priority 3] Error states** - I need feedback when things aren’t working as expected or something on the Twilio side fails

![Untitled](Over-Engineered%20-%20%E2%80%9CDaily%20Dispatch%E2%80%9D/Untitled%203.png)

[This simulates scores coming in as they are sent to the service and ready for dispatching. *Click on the video to play.*](Over-Engineered%20-%20%E2%80%9CDaily%20Dispatch%E2%80%9D/Screen_Recording_2024-05-27_at_5.20.56_PM.mov)

This simulates scores coming in as they are sent to the service and ready for dispatching. *Click on the video to play.*

---

# Conclusion

This exercise was fun. Even with a simple idea to overcomplicate a problem 😆, I had to think about so many aspects of how to design the experience and build the app.

I had fun using [Miro](https://miro.com/) for my diagrams, [Figma](https://www.figma.com/) for my prototypes and design, and [Notion](https://notion.ai/) once again for this article.

Let’s recap what I did in this walkthrough:

- Identified and defined a problem
- Measured the impact of solving the problem
- Ideated on a possible solution
- Sketched how it might work in the real world
- Started to visualize interactions in my prototype

---

# Appendix

I’ll admit I had to ask myself the question of how to frame the benefit of reducing effort vs. increasing efficiency and what an equivalent statement would be. But then I realized this might be the perfect question for ChatGPT:

![Screenshot 2024-05-27 at 10.05.00 PM.png](Over-Engineered%20-%20%E2%80%9CDaily%20Dispatch%E2%80%9D/Screenshot_2024-05-27_at_10.05.00_PM.png)

## ChatGPT response

> Yes, framing a task that takes half the time due to a workflow improvement as a 50% reduction in effort is the same as framing it as a 100% gain in efficiency. Here’s the detailed reasoning:
> 

**50% Reduction in Effort**

![Screenshot 2024-05-27 at 10.08.54 PM.png](Over-Engineered%20-%20%E2%80%9CDaily%20Dispatch%E2%80%9D/Screenshot_2024-05-27_at_10.08.54_PM.png)

**100% Gain in Efficiency**

![Screenshot 2024-05-27 at 10.09.35 PM.png](Over-Engineered%20-%20%E2%80%9CDaily%20Dispatch%E2%80%9D/Screenshot_2024-05-27_at_10.09.35_PM.png)

**Conclusion**

- A 50% reduction in the time to complete a task translates to the task taking half as long as before.
- This results in the efficiency doubling, which is a 100% increase in efficiency.

Thus, saying there is a 50% reduction in effort is indeed the same as saying there is a 100% gain in efficiency.

---

Thank you, ChatGPT.