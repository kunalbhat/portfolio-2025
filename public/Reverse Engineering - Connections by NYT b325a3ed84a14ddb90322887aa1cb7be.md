# Reverse Engineering - Connections by NYT

<aside>
💡 *Note: I’m not affiliated with the New York Times or the original creation of this game. If you’re a fan of daily word games and not familiar with Connections, you should check it out! [https://www.nytimes.com/games/connections](https://www.nytimes.com/games/connections)*

</aside>

**Table of contents**

# Context

## **About this exercise**

If you're like me, you're always curious about how things work. When using my favorite apps, I often wonder what it would take to recreate the logic behind the features I interact with. This exercise reveals the complexity behind even the simplest appearing apps and offers several benefits, drawing on my diverse background.

- As a **designer**, I analyze an existing UI, identifying the relationships between various elements, components, and content.
- As a **PM**, I break down the app into discrete features, articulate the value or purpose of a feature, identify dependencies, and define the scope of what I'm going to build.
- As an **engineer**, I contemplate **how** to integrate these elements and actually build the product.

I thought it would be interesting to demonstrate this process with a specific example. So, what am I reverse engineering this time? It's one of my favorite word games by the New York Times - [Connections](https://www.nytimes.com/games/connections). Let's dive in!

## What is Connections?

Let’s get a clear understanding of what this game is. 

> Connections is a game where your task is to find groups of four items that share something in common.
> 
- Select four items and tap ‘Submit’ to check if your guess i correct
- Find the groups without making 4 mistakes!

Now that we have that context, the next step is to break down the UI of this game. To start, there are some primary elements and functionality I’m focusing in on.

---

# Part 1: Product breakdown

## Simple heuristic

A quick evaluation of the existing UI and notes on any observations and assumptions I’m making regarding functionality.

![Untitled](Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled.png)

| Element | Notes |
| --- | --- |
| Title | Display static string |
| Board | Display 4 x 4 grid of 16 unique text strings contained in a ‘tile’
• Highlight a item when selected
• Max 4 items can be highlighted at a time |
| Scoring | Reflect number of mistakes remaining |
| Controls | • Shuffle: Randomly redistribute the items in the grid above
• Deselect all: remove highlight from any selected tiles
• Submit: Submit 4 selected tiles for matching |
| Misc notes | • Shuffle button is always enabled
• Deselect all: enabled once 1 item is selected |
| Menu | This isn’t core functionality, so I’m going to remove this from scope  |

Here’s the full suite of screens I gathered to further break down states and interactions and help define scope.

### Core screens

![Selected items](Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled%201.png)

Selected items

### Secondary screens

![Guess accuracy notification](Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled%202.png)

Guess accuracy notification

![Solved group](Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled%203.png)

Solved group

![Completed game](Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled%204.png)

Completed game

![Welcome screen](Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled%205.png)

Welcome screen

![Instructions sheet](Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled%206.png)

Instructions sheet

![Settings sheet](Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled%207.png)

Settings sheet

![Game summary sheet	](Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled%208.png)

Game summary sheet	

I’m seeing a bit more functionality that needs to be accounted for. This isn’t exhaustive, but it should be enough to get started on building. It looks like I need to display an alert that reports on things like how close a guess is to the solution group, or my overall ranking on the game based on how many misses I had.

| Element | Notes |
| --- | --- |
| Alert | **Display guess feedback**
• Indicate when a group is “one away” from correct

**Display game rating**
• Show “Perfect, great, good” etc. depending on how many misses are left after the game is done

**Incorrect guesses**
• Display an alert “One away...” if the guess contains 3/4 correct items in the group
• Display “Already guessed” and disallow players from guessing an incorrect group more than once |
| Board / Correct group | **Display completed rows**
• Assign it a color based on difficulty level
• Display group title
• Display group items |
| Scoring | Reflect number of mistakes remaining |
| Misc notes | • Move completed groups to the top of the board
• ‘Shake’ animation for board for incorrect guesses
• Alert appears for *X* amount of seconds |

## Data model

Based on the game board, here’s a quick sketch of how a simple version of the data could be modeled…

![Untitled](Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled%209.png)

```jsx
const gameData = {
    data: {
      1: {
        title: "Power issues",
        difficulty: 1,
        items: ["spike", "surge", "outage", "short"],
      },
      2: {
        title: "Summary",
        difficulty: 2,
        items: ["digest", "brief", "outline", "abstract"],
      },
      3: {
        title: "Trust as real",
        difficulty: 3,
        items: ["accept", "believe", "buy", "swallow"],
      },
      4: {
        title: "Name homophones",
        difficulty: 4,
        items: ["kneel", "wane", "hairy", "curt"],
      },
    },
  };
```

Some thoughts on the initial sketch:

- There’s a new board each day so the overall object, which I’ve called `gameData`, likely has a bunch of other things defined in it. One example could be the date of each `data` object.
- You could name each entry in `data` something more descriptive, but I’m keeping it pretty simple right now by just assigning a basic numerical value.
- Related to the above, you could infer `difficulty` from the name of each entry, but I like explicitly defining that.
    - I use the value of `difficulty` to map rating labels (e.g. “Perfect”, “Phew”) in the code; it’s probably cleaner to explicitly define those labels in the data object.

## Code sketch

Here’s how I am thinking about the functionality I’m going to need to build.

**Display the items of each group**

- Store initial group data in an object
- Initialize the game by:
    - Take all the items and store them in an flat array
- Randomize items and display them in a 4 x 4 grid
    - Use a randomize function to mixup the array
- Iterate through the array and display the item in a UI element (4 x 4 grid)

**Matching**

- When 4 items are selected, determine if they match any of the items arrays in the original object
- If they match, display the solved group as a new row at the top of the grid
    - Removes solved group items from board
- When all 4 groups are solved, the game is won

**Scoring**

- If all 4 tries are used, the game is over (you’ve lost!)
- A game rating (Perfect, great, good, phew) is assigned based on how many unused tries are left

---

# Part 2: Product definition

Let’s quickly define what’s in scope and what’s not for this exercise.

### In scope

I’m going to focus on building the core screens and functionality:

- Game board
    - Displaying items
    - Matching correct guesses
    - Updating the UI to reflect current state
    - Limiting max 4 items of selection
- Alerts
    - Display alerts for ~~guess accuracy and~~ game state
- Controls
    - Shuffle
    - Deselect all
    - Submit guesses

### Out of scope

I’m going to eliminate the following screens with static content that are less interesting to build:

- ❌ Welcome screen
- ❌ Instructions sheet
- ❌ Game summary sheet

A few notes on what I’m leaving out:

**Animations**

- There are some nice animated UI cues that could probably easily be accomplished by something like the React Spring library [https://www.react-spring.dev/docs](https://www.react-spring.dev/docs) but I’m going to leave those out for now just to focus on the core functionality.

**Guess accuracy**

- I won’t get to this but I’ll add this to the list of fast-follows if I do a part 2 of clean-up

**Share sheet**

Even though it’s out of scope, the game summary actually has a lot of interesting things going on.

The visual map is great for sharing scores. I don't intend to store local data or track guesses in app state, but if I did, I could record each guess, its proximity to the solution group, and represent that guess history using abstract shapes and colors.

- Identify how close incorrect guesses were to a solution group
- Identify from which group the incorrect guesses came
- Track of the order of guesses

---

# Part 3: Building

Now I’ll describe my approach to building this application. 

<aside>
💡 A lot of this code is a first-pass and certainly not for production. I’ll note under each block of code where I think there is room to optimize or just do something differently from how I approached this from scratch.

</aside>

### Data object

[https://github.com/kunalbhat/connections-clone/blob/80c4486c036f18de661f159c58155995e03dc018/app/page.js#L10-L33](https://github.com/kunalbhat/connections-clone/blob/80c4486c036f18de661f159c58155995e03dc018/app/page.js#L10-L33)

### Manipulate original data

I want to reference the original data, but flatten it for the purposes of displaying in the game board. 

- I’m iterating through the original data object, grabbing the `items` from each entry and pushing them into a temporary array.
- I’m also checking each time if any of the groups have been solved and only displaying the items from the groups left to solve. I’ll explain why I’m doing that a little later.
- Once I obtain a flat array of all the items I intend to display, I mix them up.
- I'll use this function to both initialize the game board and shuffle it on demand using the shuffle button.

[https://github.com/kunalbhat/connections-clone/blob/80c4486c036f18de661f159c58155995e03dc018/app/page.js#L45-L62](https://github.com/kunalbhat/connections-clone/blob/80c4486c036f18de661f159c58155995e03dc018/app/page.js#L45-L62)

### Compare items to solution groups

Now I need to determine whether a set of items matches a solution group and if not, how far off it is.

- I’m collecting the selected items items, iterating through the correct groups and seeing if there are any matches
- I’m sorting both arrays so they are ordered alphabetically and easier to compare

[https://github.com/kunalbhat/connections-clone/blob/80c4486c036f18de661f159c58155995e03dc018/app/page.js#L64-L88](https://github.com/kunalbhat/connections-clone/blob/80c4486c036f18de661f159c58155995e03dc018/app/page.js#L64-L88)

These are the parts doing the most work, but there’s obviously a bit more going on, so I invite you to check out the [Github repo](https://github.com/kunalbhat/connections-clone) (specifically [page.js](https://github.com/kunalbhat/connections-clone/blob/main/app/page.js)) to see the full code!

# Live code sketch

It was really easy to deploy the code to [Vercel](http://vercel.com), the Github integration makes it seamless! 

Check it out live, hosted on Vercel: 

[https://connections-clone-eight.vercel.app/](https://connections-clone-eight.vercel.app/)

# Conclusion

It actually took me longer to create this write-up than it did to build the app 😂 but I really enjoyed documenting my process. Notion also made it really easy to embed Github code, use a little AI (not too much though!) to clean up some of my writing, and embed the final product. I’ll definitely do this again sometime!