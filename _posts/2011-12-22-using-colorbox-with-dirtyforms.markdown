---
layout: post
title:  "Using ColorBox with Dirty Forms"
date:   2011-12-22 11:00:00
categories: tutorial
---

Recently, I was working on a form that had some sensitive data that the user was required to submit, but often the user would navigate away from the page without saving their work. To combat this, I turned to [Dirty Forms](https://github.com/snikch/jquery.dirtyforms); a jQuery plugin to prevent users from losing unsumbmitted HTML form data.

By default, it uses [FaceBox](http://defunkt.io/facebox/). I however, was using [ColorBox](http://jacklmoore.com/colorbox/) as my lightboxing library and needed a way to substitute it in. Thankfully, Dirty Forms lets you override the dialog box with bindings.

And so, I present to you the dialog bindings for a ColorBox based dialog:

{% highlight javascript %}
$.DirtyForms.dialog = {
  selector : '#cboxContent',
  fire : function(message, title) {
    var content = '<h3>' + title + '</h3>' + 
                  '<p style="padding: 10px;">' + message + '</p>' + 
                  '<br />' + 
                  '<p> <a href="#leave" id="leave" class="button delete delete-item">Lose changes and leave</a> <a id="stay" href="#stay" class="button">Stay on current page</a></p>';
    $.colorbox({html: content, width: "500px", height: "240px"});
  },
  bind : function() {
    var close = function(decision) {
      return function(e) {
        e.preventDefault();
        $.colorbox.close();
        decision(e);
      };
    };
    $("#stay").click(close(decidingCancel));
    $("#cboxClose").click(close(decidingCancel));
    $("#cboxOverlay").click(close(decidingCancel));
    $("#leave").click(close(decidingContinue));
  },
  refire : function(content, ev) {
    $.colorbox({html: content, width: "500px", height: "300px"});
  },
  stash : function() {
    if ($("#cboxContent").html != "") {
      return $('#cboxContent').clone(true);
    }
    else {
      return false;
    }
  }
};
{% endhighlight %}
