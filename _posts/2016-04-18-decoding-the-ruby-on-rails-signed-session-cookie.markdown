---
layout: post

title: Decoding the Ruby on Rails signed session cookie
---

*Note: this article is primarily about Ruby on Rails 3 which uses a cryptographically signed cookie while Ruby on Rails 4+ has an [encrypted cookie by default](http://www.rubydoc.info/docs/rails/4.1.7/ActionDispatch/Session/CookieStore)*

I was prompted at work recently to review the use of cookies within the app. I figured that I could take a look at the source code to see how they were being used (which I did) and also I should take a look in the browser as to which cookies are being set which would also tell me any 2nd or 3rd party cookies are being set.

One last bit that I wanted to review was what exactly we were storing in the cryptographically signed cookies in the app, mainly the session cookie. The app I'm working with is on rails 3.2, so we should be able to decode it without knowing the secret key used to sign it.

I tried a little bit of Googling which led me to [this article](http://www.andylindeman.com/decoding-rails-session-cookies/), but the script provided didn't work out of the box, so I had to investigate a bit to get it to work. I think that there's some good material there for future articles as to specifically what the structure of the cookie is and why it's set up as it is, but for now I'll just post the script to decode it.

## The script

First, let's get a cookie. I used a new rails 3.2.22.2 app with a controller that sets the session value `my_variable` to `my_value`. Here's how to get the cookie using curl:

```sh
$ curl -I localhost:3001/ | grep Set-Cookie
Set-Cookie: _my_new_app_session=BAh7B0kiD3Nlc3Npb25faWQGOgZFVEkiJWE1NTA3NWU2MDBjYjE1NWY3N2Y0NzhkOWE3NzdlYzY2BjsAVEkiEG15X3ZhcmlhYmxlBjsARkkiDW15IHZhbHVlBjsAVA%3D%3D--9583fe7995314e148eaa4c16269ca2f6864f6abf; path=/; HttpOnly
```

The part we're interested in is this:

```
BAh7B0kiD3Nlc3Npb25faWQGOgZFVEkiJWE1NTA3NWU2MDBjYjE1NWY3N2Y0NzhkOWE3NzdlYzY2BjsAVEkiEG15X3ZhcmlhYmxlBjsARkkiDW15IHZhbHVlBjsAVA%3D%3D--9583fe7995314e148eaa4c16269ca2f6864f6abf
```

Note that the equal signs (`%3D`) are [URI encoded](https://en.wikipedia.org/wiki/Percent-encoding). The original blog post did not take this into account, so the code didn't work. Here's the working script:

```ruby
#!/usr/bin/env ruby
# just pass in the string straight from `curl -v http://my-url-goes-here.com | grep Set-Cookie`
# should look like this:
# Set-Cookie: _my_new_app_session=BAh7B0kiD3Nlc3Npb25faWQGOgZFVEkiJWE1NTA3NWU2MDBjYjE1NWY3N2Y0NzhkOWE3NzdlYzY2BjsAVEkiEG15X3ZhcmlhYmxlBjsARkkiDW15IHZhbHVlBjsAVA%3D%3D--9583fe7995314e148eaa4c16269ca2f6864f6abf; path=/; HttpOnly
# e.g. ruby decode.rb BAh7B0kiD3Nlc3Npb25faWQGOgZFVEkiJWE1NTA3NWU2MDBjYjE1NWY3N2Y0NzhkOWE3NzdlYzY2BjsAVEkiEG15X3ZhcmlhYmxlBjsARkkiDW15IHZhbHVlBjsAVA%3D%3D--9583fe7995314e148eaa4c16269ca2f6864f6abf
require 'uri'
require 'rack'

base64_text = URI.unescape(ARGV[0])
first_part_text, second_part_text = base64_text.split('--')

puts Rack::Session::Cookie::Base64::Marshal.new.decode(first_part_text)
```

Here's it working:

```sh
$ ruby decode.rb BAh7B0kiD3Nlc3Npb25faWQGOgZFVEkiJWE1NTA3NWU2MDBjYjE1NWY3N2Y0NzhkOWE3NzdlYzY2BjsAVEkiEG15X3ZhcmlhYmxlBjsARkkiDW15IHZhbHVlBjsAVA%3D%3D--9583fe7995314e148eaa4c16269ca2f6864f6abf
{"session_id"=>"a55075e600cb155f77f478d9a777ec66", "my_variable"=>"my value"}
```

## Further research

If you want to dive deeper into how the signed session cookie works, I recommend taking a look at where [ActiveSupport::MessageVerifier](http://apidock.com/rails/v3.2.13/ActiveSupport/MessageVerifier) is used in rails.
