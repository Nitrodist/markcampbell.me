---
layout: post

title: "A lesson in logging: never hide behavior"
---

Recently, I was working on implementing a health check endpoint to one of our Rails apps. It is a simple endpoint that basically responds with 200 OK and a JSON response. During the code review process, one of my coworkers brought up the fact that it's quite annoying to be tailing the log and constantly seeing requests for `/lbhealth` (or similar) 'polluting' the log. He then asked to just suppress the messages in the Rails log.

From his point of view, the requests themselves are noise since he's only concerned with the requests made to the webapp (system) that a user would interact with. When he's tasked with debugging some behavior on one of our staging servers, he's met with a large log and more than half of the requests to the app are filled with health check requests. He's quite right in that seeing the requests slows down his ability to just see the relevant information.

Since I'm the one who made the pull request, I'm now tasked with justifying why we would want that information in the logs. As I thought about it further, I realized that it also applies not only to this kind of a request but to a lot other parts of a system you're operating where you're generating logs.

## Philosophy

Fundamentally, logs provide you with an audit trail of events within your system. To paraphrase [Wikipedia's entry on logging](https://en.wikipedia.org/wiki/Logfile), this is *invaluable* and essential to understanding the activities of a complex system, especially one such as a webapp where you are not interacting with it yourself in production: your users are! Whether it's trying to reproduce problems or be notified of problems immediately (rather than after that angry email from the user!), logging is essential.

Switching your point of view to being someone who is *operating* the system rather than *developing* the system is important. Just because something is noisy does not mean that it does not have value. In our example, the health check is for AWS's Elastic Load Balancer (HAProxy and other load balancers have a similar function). A successful response from the endpoint means that the individual web server is capable of accepting web traffic. If it returns anything other than an HTTP 200 OK response, it'll take it out of the load balancer, meaning that your cluster of web servers is now running at reduced capacity. You also run the risk of writing code that inadvertently removes the health check, deploying it, and taking down the entire cluster of web servers. Bad news!

Hiding the behavior of your system means you are permanently removing the ability to diagnose past problems that rely on that information. In this case, it could manifest itself as an angry developer on call at 6PM on a Friday evening who is trying to figure out why the entire app cluster is down. He's tailing the log and not seeing 500 errors in the Rails log for the load balancer endpoint because we decided to suppress the request in the log (hypothetically, of course... no, seriously, this didn't happen to me). Worse yet, people tasked with operating these systems are often not developing the system, so they do not know that someone intentionally is suppressing the information, causing them to be led to incorrect conclusions such as a line of thinking that the request is not making it to the web app since it's not showing up in the app's log. In fact, having *no log* would probably be better than suppressing *some* of the log, in this case! That's how messed up it is!

## Characteristics of good logs

Having just a log with just text isn't usually useful as it lacks context. The metadata in is incredibly valuable (in fact, so much that people have developed common logging tools, logging infrastructures, products, and services that pride themselves on the flexibility of the metadata). Note, this metadata is not limited to each line: application level metadata is just as important because it'll usually have valuable and debuggable information.

1. Application and domain specific knowledge (e.g. "working on file 'a.xml' 300 of 733")
1. Timestamp of when the message was created
1. Tags associated with the messages (e.g. unique web request ID, unique job attempt ID, process ID, user ID in request, etc.)
1. Level of the message (e.g. warn, info, critical, error, debug, etc.)
1. Logging when things start and end (e.g. jobs, web requests, CLI invocations, etc.)

I'm sure I'm missing a lot of obvious points. What's important, though, is thinking along the lines of "what would I want to know if X happened?" where X are past problems you've had to deal with. This is dependent on the problem domain, but you'd be surprised how much crossover there is between problem domains. Asking experienced colleagues is a good starting point or asking the Internet at large.

## Filtering and an example

How can everyone be happy? Well, we as developers and operators of systems need to become experts at finding relevant information and finding it fast. Suppressing information is usually not the answer. *Filtering* is the answer (note, you're probably already filtering by going to the correct file in the first place!).

I find that the `grep` tool is incredibly powerful and that it has a dizzying array of options that you can learn about to add to your toolkit. Below, I'll show you how to filter out the load balancer requests from the Rails log using grep and tagged logging that comes with Rails.

In this example, we have 4 requests:

1. `GET /lbhealth`
1. `GET /my-real-endpoint`
1. `GET /lbhealth`
1. `GET /my-real-endpoint`

Here's what it looks like in the log (sorry, you'll need to scroll to the right):

```
I, [2016-10-10T18:46:20.858201 #15793]  INFO -- : [94f74f3e-2801-4fe2-99ba-9f15f2e357c3] Started GET "/lbhealth" for 127.0.0.1 at 2016-10-10 18:46:20 +0000
I, [2016-10-10T18:46:20.858829 #15793]  INFO -- : [94f74f3e-2801-4fe2-99ba-9f15f2e357c3] Processing by HealthCheckController#load_balancer_check as */*
I, [2016-10-10T18:46:20.859301 #15793]  INFO -- : [94f74f3e-2801-4fe2-99ba-9f15f2e357c3] Completed 200 OK in 0ms (Views: 0.2ms | ActiveRecord: 0.0ms)
I, [2016-10-10T18:46:20.867820 #15793]  INFO -- : [ae215886-224d-4c1c-9b44-e8d7b6ebe50b] Started GET "/my-real-endpoint" for 127.0.0.1 at 2016-10-10 18:46:20 +0000
I, [2016-10-10T18:46:20.890316 #15793]  INFO -- : [e57797e8-0815-4b69-aed3-82b773516692] Started GET "/lbhealth" for 127.0.0.1 at 2016-10-10 18:46:20 +0000
I, [2016-10-10T18:46:20.890739 #15793]  INFO -- : [e57797e8-0815-4b69-aed3-82b773516692] Processing by HealthCheckController#load_balancer_check as */*
I, [2016-10-10T18:46:20.891118 #15793]  INFO -- : [e57797e8-0815-4b69-aed3-82b773516692] Completed 200 OK in 0ms (Views: 0.1ms | ActiveRecord: 0.0ms)
I, [2016-10-10T18:46:20.899458 #15793]  INFO -- : [1255860a-624a-47e2-85b4-cd5a35de8813] Started GET "/my-real-endpoint" for 127.0.0.1 at 2016-10-10 18:46:20 +0000
```

To this:

```
I, [2016-10-10T18:46:20.867820 #15793]  INFO -- : [ae215886-224d-4c1c-9b44-e8d7b6ebe50b] Started GET "/my-real-endpoint" for 127.0.0.1 at 2016-10-10 18:46:20 +0000
I, [2016-10-10T18:46:20.899458 #15793]  INFO -- : [1255860a-624a-47e2-85b4-cd5a35de8813] Started GET "/my-real-endpoint" for 127.0.0.1 at 2016-10-10 18:46:20 +0000
```

Notice that there are GUID values that persist across each request (the `94f74f3e-2801-4fe2-99ba-9f15f2e357c3` value is an example). This value is generated at the beginning of a web request in Rails and attached to all log calls for that request after that point. We're then going to:

1. `grep` through the log and collect the GUID values for calls to `/lbhealth`
1. Feed back the GUID values into another `grep` command that is filtering lines containing those values via the `-v` and `-F` flags.

```sh
cat staging.log | # display the file
  grep -v -F "$(cat staging.log | # filter any lines out matching the list of newline separated values from the command substitution $(...)
    grep 'Started GET "/lbhealth"' | # get lines with /lbhealth
    grep -o -E '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')" # pick out the GUID pattern using regex
```

If you have centralized logging infrastructure such as ELK or [Splunk](https://en.wikipedia.org/wiki/Splunk), then you can use those querying languages to do the filtering for you (probably a lot more easily, too).

## Closing thoughts

This is a difficult concept to communicate, mostly because the benefits may not apply directly to the person being told and the benefits are not immediate. Truly understanding the systems that we are tasked with operating is the only sane path to improving those systems and even ourselves. I feel that all developers can find some benefit in learning these concepts ahead of time instead of after production goes down.
