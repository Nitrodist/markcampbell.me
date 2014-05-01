---
layout: post
title:  "Logging Airbrake Error IDs in Rack or Sinatra"
date:   2014-05-02 08:00:00
categories: tutorial
---

One small thing that irked me while implementing [Airbrake](http://airbrake.io/) for an [Sinatra](http://www.sinatrarb.com/) app that we have at [theScore](http://www.thescore.com) was the fact that if an error occurs, it isn't logged anywhere. I was relying on the error showing up in Airbrake -- if it ever would!

If you have a Sinatra application, make sure to follow their instructions on [setting up Airbrake with a Sinatra app](https://github.com/airbrake/airbrake/wiki/Using-Airbrake-in-Sinatra-apps). Follow their instructions on [setting up Airbrake with a Rack app](https://github.com/airbrake/airbrake/wiki/Using-Airbrake-in-Rack-apps) if you have a Rack app.

## Halfway there

One good thing about the Rails integration that Airbrake has is that it will log the link to the Airbrake error. Since there is no unified rack log, this isn't possible. By default, **nothing about Airbrake will show up in your log**. Airbrake *does* allow you to set up logging if you want, though ([their wiki](https://github.com/airbrake/airbrake/wiki/Logging-with-Airbrake)):


{% highlight ruby %}

Airbrake.configure do |config|
  config.logger = App.logger
  config.api_key = ENV['airbrake_api_key']
end

{% endhighlight %}

However, this will only yield the following:

{% highlight irc %}

2014-05-01T18:27:06-0400: [INFO] 32065 ** [Airbrake] Success: Net::HTTPOK

{% endhighlight %}

## Access the error_id through the rack environment!

Luckily for us, Airbrake [exposes the error_id](https://github.com/airbrake/airbrake/blob/c720737660ab20d70dfbcc4976e94e5dbe103087/lib/airbrake/rack.rb#L46) in the rack environment's `airbrake.error_id` key ([briefly mentioned in their wiki](https://github.com/airbrake/airbrake/wiki/Sending-notices-to-Airbrake-manually-from-controllers)). Knowing this, we can insert some middleware above the Airbrake middleware and log it ourselves. Example:


{% highlight ruby %}
class AfterAirbrakeMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    status, headers, body = @app.call(env)
    if env["airbrake.error_id"]
      App.logger.fatal "An error was sent to Airbrake with error_id: '#{env["airbrake.error_id"]}'"
    end
    [status, headers, body]
  end
end

class App < Sinatra::Base
  use AfterAirbrakeMiddleware # must go before Airbrake's middleware so that errors are passed to it from Airbrake's middleware
  use Airbrake::Sinatra

  self.logger = Logger.new('./log/service.log')
end

Airbrake.configure do |config|
  config.logger = App.logger
  config.api_key = ENV['airbrake_api_key']
end

{% endhighlight %}

Now the log looks like this:

{% highlight irc %}

2014-05-01T18:27:06-0400: [INFO] 32065 ** [Airbrake] Success: Net::HTTPOK
2014-05-01T18:27:06-0400: [FATAL] 32065 An error was sent to Airbrake with error_id: '1146548809544442069'

{% endhighlight %}

Isn't that better? I'm sure there's a way to create a direct link to the page with that error_id, too! Something to investigate for the future.
