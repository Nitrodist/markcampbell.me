---
layout: post
title:  "How to set up a Jekyll blog on Heroku"
date:   2013-05-18 16:00:00
categories: jekyll heroku
---

While setting up this blog, I ran into [an issue](https://github.com/mattmanning/heroku-buildpack-ruby-jekyll/pull/7#issuecomment-17722748) trying to deploy to Heroku successfully. The deploy would succeed, but then I would get the big 'Something went wrong' page from Heroku! What was going on? Better check out the logs:

<pre>
     ERROR: YOUR SITE COULD NOT BE BUILT:
            ------------------------------------
            Post 0000-00-00-welcome-to-jekyll.markdown.erb does not have a valid date.
</pre>

[Full output here in a gist.](https://gist.github.com/Nitrodist/5605565)

Since I had only installed Jekyll a few minutes beforehand, I was quite confused as to the source of this error. I noticed that I had a file similar to that in the `_posts` directory but it had a different date. Looking through the log a bit more, I noticed that it was looking in `vendor`! What the heck? I don't have a `vendor` directory locally! What's going on?

Here's what happened:

1. You deploy to Heroku
1. Heroku decides to install your gems to `vendor`
1. Heroku then uses [foreman](https://github.com/ddollar/foreman) to start your web app ([check out the docs](https://devcenter.heroku.com/articles/procfile)),
1. Jekyll boots and then promptly **explodes** because it's processing all files in `vendor` that end in `.erb` (where the Jekyll template lives)

You can reproduce the error by installing the gems with [Bundler](http://gembundler.com/) to `vendor` with the `--path vendor` option:

{% highlight bash %}
bundle install --path vendor
bundle exec jekyll serve
{% endhighlight %}

To fix this problem, we're going to modify the `_config.yml` file that determines which options that Jekyll launches with. Adding `vendor` to the `exclude:` option will tell Jekyll to not generate copy and process any files from the `vendor` directory.

Your `_config.yml` file should look something like this:

{% highlight yaml %}

name: Your New Jekyll Site
pygments: true
exclude: ["vendor"]

{% endhighlight %}

Now your Heroku app should work!

## Caveats Looking Forward

So you've discovered that Jekyll will load any directory. Did you know that it also applies to files in the *root directory*? Let's make a request for `Gemfile`:

{% highlight ruby %}

$ curl http://localhost:5000/Gemfile
source "https://rubygems.org"

gem 'foreman'
gem 'jekyll'
$
{% endhighlight %}

**Woah**, didn't mean to expose that information to the public! So what can we do? We can:

1. Add more items to the `exclude:` list in `_config.yml`
1. Prefix the filename with an underscore if possible
1. Nothing else

That's it, unfortunately. Also, we can't use `include:` to combat this problem. The `include:` directive does not mean **only include these files**, but rather **additionally include these files** as Jekyll doesn't load files beginning with `.` (such as `.htaccess` which is the default `include:` setting) or `_` (file or directory alike). Perhaps in the future there'll be more fine-grained control for Jekyll so that you can specify a list of directories and files to use.

If you're interested in reading more about Jekyll configuration, you can read their [docs](http://jekyllrb.com/docs/configuration/).
