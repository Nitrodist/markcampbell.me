---
layout: post

title: Mutate your Rack middleware's env!

excerpt: |
  Rack middleware is a powerful pattern to follow, however, there are some 'gotchas'
  that you need to keep in mind when developing new middleware. This post explains
  how you should be using Rack's <code>env</code>.

author:
  name: Mark Campbell
  link: http://markcampbell.me
---

*[originally appearing on theScore's blog](http://techblog.thescore.com/2014/12/04/modify-your-racks-env-hash/)*

If you've been a Ruby developer for a while, chances are that you've written some kind of Rack middleware. Rack is a pretty big part of web development with Rails, and here at theScore we've developed a few, small pieces of middleware to add additional data to our requests so that our Rails applications can use it.

If you're not familiar with Rack or Rack middleware, I would recommend [this article on Rack](http://southdesign.de/blog/rack.html) and [this stackoverflow question on the middleware](http://stackoverflow.com/questions/2256569/what-is-rack-middleware).


## Background and Problem

While looking to integrate [Yeller](http://yellerapp.com/), we ran into a bug in our middleware. The bug came up because Yeller was looking for Rails specific data that was being attached to the request's `env` hash when an error was raised. In this case, during a request, `ActionController::Metal` sets `action_controller.instance` on the `env` hash:

{% highlight ruby %}
def dispatch(name, request) #:nodoc:
  @_request = request
  @_env = request.env
  @_env['action_controller.instance'] = self
  process(name)
  to_a
end
{% endhighlight %}

([source pinned to rails 4.1.4](https://github.com/rails/rails/blob/7c4bfe1c954ef90acf4f790e46fcbbd07d85af3e/actionpack/lib/action_controller/metal.rb#L195))

In Yeller, the error reporting code extracts that information to give us a better idea of what controller and action was involved when the error occurred:

{% highlight ruby %}
def render_exception_with_yeller(env, exception)
  # ...
  controller = env['action_controller.instance']
  # ...
  if controller
    # ...
    location = "#{controller.class.to_s}##{params[:action]}"
  else
    # code without location information available
  end
end
{% endhighlight %}

([source pinned to yeller_ruby 0.2.2](https://github.com/tcrayford/yeller_ruby/blob/355cb6b874c6ddf0b3ee1d3d5012b9db16b7e0c0/lib/yeller/rails.rb#L58))

When we ran Yeller's verification Rake task, our errors were being sent to Yeller's servers, but the Rake task also told us that we were *missing* that Rails specific information (the location, for example). So, we scratched our heads a bit. Error reporting worked in new Rails applications, so it had to be something in our code.

I started by removing our custom middleware -- we had three of them and I removed all of them. The rake task succeeded! So I started adding them in one-by-one until I added one and the rake task failed. At this point, I had narrowed the code down to about 3 lines and they looked something like this:

{% highlight ruby %}
def call(env)
  api_version = env['HTTP_X_API_VERSION'].presence || default_api_version
  api_version = api_version.to_s.split(',').first # Handle bad API versions with commas in them
  @app.call(env.merge('the_score.api_version' => ApiVersionDecorator.new(api_version)))
end
{% endhighlight %}

## The Solution

After showing Yeller's team the middleware, they saw the problem! `env.merge` returns a *new* hash. The 'gotcha' in this case is this:

> The scope of the `env` hash exists *after* calls to `@app.call` finish. Because of this, `@app.call` should be invoked with the same `env` hash passed into the method.

Middleware that rely on subsequent middleware (or the app) to set information (e.g. `action_controller.instance`) on the `env` hash also rely on the fact that the subsequent middleware won't pass a *different* `env` hash to the subsequent middleware. If the subsequent middleware *do* pass a different hash, here's what happens:

1. The new `env` is only used from that point forward in the middleware stack
2. Needless memory is allocated because you've just duplicated every request's information in a separate `env`

The fix and proper way to do this is to instead *mutate* your hash through `Hash#[]`, `Hash#merge!`, `Hash#store`, and so forth. A new hash isn't created when you use these methods. Here's the fixed code:

{% highlight ruby %}
def call(env)
  api_version = env['HTTP_X_API_VERSION'].presence || default_api_version
  api_version = api_version.to_s.split(',').first # Handle bad API versions with commas in them
  @app.call(env.merge!('the_score.api_version' => ApiVersionDecorator.new(api_version)))
end
{% endhighlight %}

If you want to see the problem happening in your console with a 'real' Rack request (OK, not really, it uses `Rack::MockRequest` in the tests), you can clone [this project](https://github.com/Nitrodist/rack-middleware-gotcha) that I've created, `bundle install`, and run `rspec`.

## Bonus: How to Test It

We had a suite of tests using rpsec around these simple pieces of middleware, so we added something like this to every test:

{% highlight ruby %}

class MyMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    @app.call(env)
  end
end

describe MyMiddleware do
  let(:app) { double(:app) }
  let(:env) { double(:env) }

  subject { MyMiddleware.new(app) }

  it "calls app with the same env hash" do
    expect(app).to receive(:call).with(env)
    subject.call(env)
  end
end
{% endhighlight %}

## Conclusion

Rack is fairly straightforward, but there definitely are some 'gotchas' that you can run into. This is just one example and there are a few more that you need to consider when creating Rack middleware. In a future post, I'll explain another 'gotcha' with regards to multithreading and Rack middleware.

Another interesting point is that this is a 'bug' that has been in our code base for a little over two years without being noticed. It just goes to show that every once in a while, you should take a look at the pieces of middleware that your application depends on: they may be misbehaving like ours was!
