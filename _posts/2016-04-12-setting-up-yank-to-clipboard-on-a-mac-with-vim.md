---
layout: post

title: Setting up Vim to yank to clipboard on Mac OS X
---

I'm writing this post because it took me a long time to figure out all of the little steps necessary to get Vim to yank to the clipboard.

I'm using *El Capitan* which is the latest version of OS X at the time of this writing (2016-04-12), so keep that in mind.

## Ensuring Vim is capable

There's two things that Vim needs to be able to copy to OS X's clipboard: clipboard support and x11 clipboard support.

To check if they're enabled, run `vim --version` and you should see two items in there that have plus signs next to them:

```
+clipboard
+xterm_clipboard
```

If you don't see those, then you need to install a Vim with those options enabled. Note, the default vim that comes with OS X does *not* have either enabled.

### Installing Vim via homebrew with the proper options

I use [homebrew](http://brew.sh/) and I used it to install Vim with the proper flags enabled. If you run `brew options vim`, you'll see the options available. What we're looking for is `--with-client-server`:

```sh
$ brew options vim
...
--with-client-server
  Enable client/server mode
...
```

If you don't see it, you may need to run `brew update` to get the latest brew updates. After that, install it like this:

```sh
$ brew install vim --with-client-server
...a few lines later...
🍺  /usr/local/Cellar/vim/7.4.1724: 1,684 files, 25M, built in 42 seconds
```

## Running XQuartz X11 server

So, since you're running OS X, you don't have an X11 server running. The solution to this is to run [XQuartz](http://www.xquartz.org/) (installer for it is there).

After you've installed it, make sure that your preference pane is set up like this (this step is vital!):

![XQuartz Preferences Pane Screenshot](/images/2016-04-12-setting-up-yank-to-clipboard-on-a-mac-with-vim/xquartz_preferences.jpg)

The last item ('Update Pasteboard immediately when new text is selected') is *not* selected by default which I didn't know was necessary in order to have vim copy to clipboard.

## Setting Vim to use the clipboard

TL; DR: you should have this in your `.vimrc`:


```vim
" yank to clipboard
if has("clipboard")
  set clipboard=unnamed " copy to the system clipboard

  if has("unnamedplus") " X11 support
    set clipboard+=unnamedplus
  endif
endif
```

## Conclusion

That's it! Feel free to correct me!
