---
layout: post
title:  "The Ideal Web Application Development Cycle"
date:   2013-08-19 08:00:00
categories: tutorial
---

So you're a web application developer working alongside a bunch of other developers. You're a part of a team! Every workplace has their own way of doing things and being a part of a team usually means that the team you're working on is **your** team.  Exposure to other teams or companies and how they do things is not a common occurrence. In fact, I know of a company that recently moved off CVS!

Sharing what knowledge I know about the development cycle is **key** to your success and, surprisingly, my success.  Developing a product is difficult and when you're working on a team you're isolated from seeing other solutions to problems. Openly sharing what I have starts a discussion and gives everyone better ideas on how to do things.

Over the past couple years I've worked at [Wave](https://www.waveapps.com/), with [Nathan Bertram](http://trueperspective.net/) on [ArrangeMySeat](https://arrangemyseat.com), and, most recently, at [theScore](http://www.thescore.com/). In each environment, I've found that we've used or ended up with a really effective, easy, and low-friction development cycle. Here is what I know about the ideal development cycle from my experiences.

## Overview of the Flow

To give you an idea of the whole process, here's an overview of the steps:

1. Track everything about a feature/bug in a issue tracker
2. Isolate work per feature/bug in a branch based off master
3. Tests that accompany a feature/bug
4. Create a pull request and have two other engineers code review it
5. Having your [CI](https://en.wikipedia.org/wiki/Continuous_integration) server build your project
6. Formal QA
7. Merge and ensure that the CI server's build is passing
8. Deploy

### Issue Tracker for Features *and* Bugs

Communication is key within a team. Another important aspect is the ability to remember what needs to be done. Keeping track of a feature/bug within an issue tracker does **both**! Consider this:

* The entire history of the feature/bug is communicated to your team
* Everything that was agreed upon about the feature/bug is recorded
* There's *one* authoritative place for the planning, status, and execution of features/bugs
* You can refer to the feature/bug by simply linking to it

An issue tracker lets you record ideas. An issue tracker doesn't take a two week vacation! Instead of saying "wouldn't it be great if..." and then trying to remember the next day/week/month what was said, you can look up exactly what was said about it! Being able to work on features/bugs when people are unavailable is awesome (and increases the [bus factor](http://en.wikipedia.org/wiki/Bus_factor)).

Compartmentalizing work so that you can think and focus on distinct features/bugs not only helps yourself, but your co-workers and managers (such as project managers) who need high visibility on each feature/bug. As soon as your project managers can see how fast and what work is getting done, then the planning within your team on what can get accomplished becomes more realistic.

Linking to features/bugs is powerful. It can be referenced in IRC, Email, Hipchat, etc. and even the issue tracker itself. As someone who [worked remotely]({% post_url 2013-05-23-how-to-work-remotely %}), this greatly improves the communication.

As far as software choices go, I can recommend a few:

* [GitHub](https://github.com/) (if you use GitHub for development)
* [JIRA](https://www.atlassian.com/software/jira) (has everything under the sun)

There are tons of others out there, but I've found JIRA to be the go-to replacement when GitHub becomes too unwieldy. Check [Wikipedia's entry on issue-tracking systems](http://en.wikipedia.org/wiki/Comparison_of_issue-tracking_systems) for more.

### Isolate Into Feature Branches

For each feature/bug you work on, have only **one** branch for it. Once the branch is 'done', it will be merged into the master branch (read: production) and can then be safely removed. [Atlassian has some words](http://www.atlassian.com/git/workflows#!workflow-feature-branch) to say about this. Even [GitHub follows this method](http://scottchacon.com/2011/08/31/github-flow.html).

Having each feature/bug in its own branch allows for a few things:

* Master can be kept in a buildable and production-ready state
* Stuff in development (read: broken) stays out of master
* Once work is done, all that needs to happen  is a merge into master
* Development on other features/bugs isn't waylaid by this branch

### Tests for the Feature/Bug

Testing is vital to the success of a project. Keeping a suite of tests that ensures that the behaviour of the software isn't degrading is an important aspect of software development. More importantly, testing gives you **confidence** in the software you're developing.

An easy way to accomplish this requirement for the feature/bug you're working on is to first write a failing test that covers the feature/bug. This is called [test-driven development (TDD)](http://en.wikipedia.org/wiki/Test-driven_development). This gives you a few things:

1. Assurance that you are definitely solving the feature/bug
2. Protection against the feature breaking or the bug regressing
3. Demonstration that the code you're writing is working to your colleagues
4. Demonstration that the code you're writing is working to non-technical personnel (with [cucumber](http://cukes.info/))
5. Testable code

Having a test that exercises the code generally results in higher code quality. Writing testable code makes maintenance a lot easier. The code is cleaner, easier to work with, more obvious, and now you're ensuring that the behaviour isn't broken by future changes.

Another goal of your project is to actively make your project better over time (read: actively less shitty). Tested code exposes code smells and bad code. 

Sometimes you need to write a quick-and-dirty solution without tests. Just remember that you need to record in your issue tracker that you'll need to refactor the work you've done as part of maintaining your technical debt. Having a bad codebase to work with will eventually drive people from the company!

### Pull Request and Code Review

A [pull request](https://help.github.com/articles/using-pull-requests) is a request to merge the feature/bug fix into master.  The pull request should be reviewed by at least two other engineers on your team (if you have at least two others, of course -- one code reviewer will work in a pinch). If the bug fix or feature is approved, then you're ready to merge it into master!

The pull request gives visibility about what *exactly* is going to be changed in the product to fix the bug or implement the feature.  Reverting the merge is also available later if the code that you merged turned out to not be good! Having to hunt down all the commits to fix a bad bug fix or feature implementation can result in bugs especially if you're in a hurry because the code made it to production.

Having at least two other engineers look over your code and improve it ensures that the code quality in the project is higher. Good engineers don't let other engineers merge bad code! Getting feedback and growing as a developer and team is important to producing the correct product and growing as a professional developer.

Welcome the criticism from your colleagues and start discussing the problems and solutions. Developing software is a creative process with hundreds if not thousands of ways of solving problems. Your colleagues words help **you**.

### Formal QA

A QA process acts similarly to the pull request process detailed above. However, the people who are poking at your code aren't necessarily going to be developers. What they do is try to approach it from a high-level and catch any corner-cases that you might have missed.

That said, be mindful of what you're developing before you send off the code to QA. **Try to do your own QA** before you send it off to QA. Use some critical thinking to walk through a user using it and other corner-cases before you send it off. It'll make you a better developer and the feature/bug you're working on will make it through to production much more quickly.

### Continuous Integration Builds

Your CI server (such as [Jenkins](http://jenkins-ci.org/)) should run the tests based off the feature branch before merging in and also **after** on the master branch after the feature branch has been merged in. Running a test build before the merge ensures that you're not merging broken stuff. Doing after makes sure that you're not deploying broken stuff **into production** (this also accounts for commits that go directly on the master branch).

The goal of a project should be to always have master be 'green' (the test build for master is passing). If master is red (failing), you **cannot** deploy. If you're deploying while red, that means that you *know* you are deploying something that is broken. Don't do it!

Here are the times when the CI server should build the project:

* When a pull request is opened
* Every time the pull request changes (new commit, rebase, etc.)
* Every time someone commits on master
* Every time someone merges into master (same as above)

Other than reliability, the **confidence** for developers and ease of mind is *very* important. Having an automatic build means that a developer isn't responsible for running the tests (although, they should be running them locally if the tests run quickly enough). Running tests tends to correlate with the amount of time playing foosball, depending on the length of your tests!

### Deploy

OK, you've gone through the whole process up to this point. Your fellow developers have given you the thumbs up. The fix for the feature/bug has been shown to the stakeholder. QA has given their stamp of approval. Master is green after you've merged it in. Master should **always** be deployable, so... deploy! Deploy it to production! Do it now!

Having the confidence to deploy to production with whatever is in master is a godsend. New bug fixes or features being merged in means that they can be actually *used* by your customers right away instead of having to fix broken stuff in master.

Working on a web application gives you the freedom to constantly update the app. There's no such thing as a 'release' as you can release new versions of your software many times a day if you want! If you've developed desktop software or apps for iPhone or Android (etc.), then you realize that you can't always rely on this. Cherish it while you can!

## Closing Remarks

I hope you've enjoyed this article! I want to hear your feedback and discussion. (insert links to reddit/hackernews here) Hit me up on [Twitter](https://twitter.com/Nitrodist)
