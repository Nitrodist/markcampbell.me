---
layout: post

title: Setting up Vim to yank to clipboard on Mac OS X
main_category: tech
snippet: "I know I have trouble getting my clipboard to cooperate sometimes: this fixes it mostly."
---

I'm writing this post because it took me a long time to figure out all of the little steps necessary to get Vim to yank to the clipboard.

I'm using *El Capitan* which is the latest version of OS X at the time of this writing (2016-04-12), so keep that in mind.

## Ensuring Vim is capable

If you just want to be able to copy to OS X's clipboard, you just need `+clipboard`. If you want X11 clipboard support, you need `+xterm_clipboard`.

To check if they're enabled, run `vim --version` and you should see two items in there that have plus signs next to them:

```
+clipboard
+xterm_clipboard
```

If you don't see those, then you need to install a Vim with those options enabled. Note, the default vim that comes with OS X does *not* have either enabled.

### Installing Vim via homebrew with the proper options

I use [homebrew](http://brew.sh/) and I used it to install Vim. If you run `brew options vim`, you'll see the options available. What we're looking for is `--with-client-server`:

```sh
$ brew options vim
...
--with-client-server
  Enable client/server mode
...
```

Now, if you just run `brew install vim`, it'll compile Vim with just `+clipboard`. If you want X11 clipboard support, you need to install it with the `--with-client-server` option.

If you don't see it, you may need to run `brew update` to get the latest brew updates. After that, install it like this:

```sh
$ brew install vim --with-client-server
...a few lines later...
🍺  /usr/local/Cellar/vim/7.4.1724: 1,684 files, 25M, built in 42 seconds
```

After you've installed it, make sure that you've set up your PATH correctly to invoke the installed Vim instead of the default system one.

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

## (optional) Running XQuartz X11 server

So at this point, you have clipboard support and it should be yanking to your clipboard. I prefer to run my Vim in conjunction with the X11 server, though. The reason for this is because I can then forward my X11 session to the systems I ssh into and have Vim on *those* systems copy to my clipboard! This works great in a Vagrant setup as welll, you just need to set `config.ssh.forward_x11` to true.

Since you're running OS X, you don't have an X11 server running. The solution to this is to run [XQuartz](http://www.xquartz.org/) (installer for it is there).  After you've installed it, make sure that your preference pane is set up like this (this step is vital!):

![XQuartz Preferences Pane Screenshot](/assets/images/2016-04-12-setting-up-yank-to-clipboard-on-a-mac-with-vim/xquartz_preferences.jpg)

The last item ('Update Pasteboard immediately when new text is selected') is *not* selected by default which I didn't know was necessary in order to have vim copy to clipboard.

## Conclusion

That's it! Feel free to correct me!
