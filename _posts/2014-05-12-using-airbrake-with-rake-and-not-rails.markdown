---
layout: post
title:  "Using Airbrake with Rake and not Rails"
date:   2014-05-12 18:00:00
categories: tutorial
---

At [theScore](http://www.thescore.com) (where I work currently), we use [Airbrake](http://airbrake.io/) for our error reporting. An error happens, the error gets sent to Airbrake and then we're notified via email. We can then investigate all the goodness from their website. Fantastic!

Most ruby apps are centered around some kind of web-service (mainly Ruby on Rails). As such, Airbrake has *really* good Rails integration -- even on their rake tasks! Airbrake is in a lot of our projects, some of which that do not use Rails, however.

A problem that I noticed while debugging why a rake task hadn't reported errors to Airbrake was two fold:

1. Airbrake is **not** configured to rescue from rake exceptions by default
2. Even if you have it enabled, it only works if you have *Rails loaded*

Isn't that crazy? [Here's the (insane) code that necessitates it](https://github.com/airbrake/airbrake/blob/51bf71ba517e9dbb1adb26f52eb6fa73a2f21c86/lib/airbrake/railtie.rb#L9). It definitely wasn't at the forefront of my mind to realize that enabling `rescue_rake_exceptions` wouldn't rescue from... rake exceptions.

The solution is to follow their [wiki entry](https://github.com/airbrake/airbrake/wiki/Using-Airbrake-with-Rake) (which I had to edit to make it correct):

{% highlight ruby %}
require 'airbrake/rake_handler' # require this if you don't have rails loaded

Airbrake.configure do |config|
  config.rescue_rake_exceptions = true
end
{% endhighlight %}

I've [raised the issue](https://github.com/airbrake/airbrake/issues/292) on Airbrake's github. Feel free to visit the link and weigh in!
