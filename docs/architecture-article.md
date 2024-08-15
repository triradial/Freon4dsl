
# Architecture Philosophy

## Introduction

What this covers is a mix of:
- A Software Architecture Philosophy / Summary
- Updated views on the classic / obvious things about software
- Special aspects when working in the Life Science domain (or most highly regulated domains?)

Talking about capital 'A' **A**rchitecture is dangerous if it doesn't incorporate the spectrum of things needed to build actual software: requirements, design, coding and even testing and teams. Taken together these are the context for the work. Without considering all of the context the result is likely pretty pictures that don't get realized, e.g., the context frequently rules-out some architectures for business or technical reasons.^Z[1] 

^[1]:A specific example is that if your context isn't a $billion+ company or transitioning to deal with scaling like at a FAANG company, you should avoid things like microservice architecture. 

Basics for doing any 'architecture' work:
- Scope - what areas of the business are covered by the architecture
- Vision - what is the current vision for the future state architecture
- Near Term Priorities - what are the first use cases 
- Incremental Approach - how does the architecture evolve from near term to vision; how does it handle scope changes

Your response is likely, "*That's obvious*". It is except for all the *obvious* realities:
- Pre-selected or pre-existing technology drives architecture, e.g., the technologists have new tech that they use as the starting point for the new **A**rchitecture. 
- Some IT or Business executive declared a vision that then warps the scope, priorities, and approach
- The scope is overly large or small
- Near term delivery is overly focused on alignment with the vision
- and lots more that you've no doubt experienced because architecture and building the software to deliver it is 'hard'.

There is no *right* approach to the above Basics. My philosophy for how to eventually get it right is based on:
- *Always* working Incrementally
- Establishing strong *boundaries* at every level

## Incremental Boundaries

Explore how each of the basics can be approached incrementally...

Finding the right scope is possible by focusing on boundaries. Boundaries, and the modularity they lead to, are a key to the entire software process. Starting by identifying the boundaries that make sense at the current and ideally the future vision enables a flexible and evolving architecture.

# Architecture Meta-Mandate: Enabling SMEs 

Explain how the vision for the architecture must be to attain some kind of *Configurable Platform*...


