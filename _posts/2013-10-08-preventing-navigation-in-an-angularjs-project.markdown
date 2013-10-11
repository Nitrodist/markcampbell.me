---
layout: post
title:  "Preventing Navigation in an AngularJS Project"
date:   2013-10-08 19:00:00
categories: tutorial
---

New technologies bring new solutions to problems. Sometimes, however, they also bring old problems back. One of these old problems for AngularJS is interrupting navigation in a web application.

It used to be that you could hook into the approriate window event ([onbeforeonload](https://developer.mozilla.org/en-US/docs/Web/API/window.onbeforeunload)) and be done with it. Unfortunately, [AngularJS](http://angularjs.org/) introduces the idea of a [single-page app](http://en.wikipedia.org/wiki/Single-page_application) in which you never *do* navigate away from that page (and thus the `window.onbeforeonload` event will never fire). Complicating the matter is the fact that when you're developing within an angular application that you're relying on the angular framework to provide you with a solution.

What's a poor developer to do?

### The glorious $locationChangeStart event

Luckily for us, angular provides a useful, (but [undocumented](https://github.com/angular/angular.js/issues/1569)!) event called `$locationChangeStart`. Here's an example of it being used:

{% highlight javascript %}
newsroom.run(['$rootScope', function ($rootScope) {
  $rootScope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
        console.log(newUrl); // http://localhost:3000/#/articles/new
        console.log(oldUrl); // http://localhost:3000/#/articles 
        event.preventDefault(); // This prevents the navigation from happening
      }
    );
  }]);
{% endhighlight %}

*Small note: there is a bug in angular 1.0.7 that allows a user to navigate away using the back button without triggering the event. Angular 1.1.5 fixes this.*

Within the event callback, we can perform any kind of logic that we wish. If we want to use a modal dialog, this is the place to do it! Angular gives us the tools to construct whatever is necessary to determine if we want to proceed or not. Cool!

So what are the cases for using this? We have a few:

* User hitting the back or forward button within your angular app
* User clicking a link from within your angular app to another part of your angular app
* User submitting a form from within your angular app

Mind you, this event will *not* fire in the following cases:

* User navigates to a page *on* your site *outside* of your angular app
* User navigates to a page *off* your site

Because of this, we still need to have an event that binds to the `window.onbeforeonload` event.

### Delegating navigation interruption to your controllers

Angular gives you that wonderful function to implement with your own logic. For the angular app I'm developing at [theScore](http://thescore.com) (hey, we're hiring [Android and iOS people](http://www.linkedin.com/company/thescore-inc-/jobs?trk=careers_promo_module_see_jobs)!), I needed a way to stop a user from navigating away from a form that they had modified (a dirty form).

The basic pattern that I came up with is that the child controllers will tell the `$rootScope` when to interrupt navigation. At first, I had something like this:

{% highlight javascript %}
newsroom.run(['$rootScope', function ($rootScope) {

  $rootScope.preventNavigation = false;

  $rootScope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
    if ($rootScope.preventNavigation && !confirm("You have unsaved changes, do you want to continue?")) {
      event.preventDefault(); // This prevents the navigation from happening
    }
  });
}]);


newsroom.controller('ArticleDetailController', ['$scope', '$rootScope', function ($scope, $rootScope) {
  $scope.$watch('articleForm.$dirty', function (dirty) {
    if (dirty) {
      $rootScope.preventNavigation = true;
    }
    else {
      $rootScope.preventNavigation = false;
    }
  });
}]);


{% endhighlight %}

One problem with the above code is that you could come back to the app on a different page and still have that variable set on `$rootScope`. So, I decided to put in the concept of the page that the navigation was prevented on as well:

{% highlight javascript %}
newsroom.run(['$rootScope', '$location', function ($rootScope, $location) {

  var _preventNavigation = false;
  var _preventNavigationUrl = null;

  $rootScope.allowNavigation = function() {
    _preventNavigation = false;
  };

  $rootScope.preventNavigation = function() {
    _preventNavigation = true;
    _preventNavigationUrl = $location.absUrl();
  }

  $rootScope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
    // Allow navigation if our old url wasn't where we prevented navigation from
    if (_preventNavigationUrl != oldUrl || _preventNavigationUrl == null) {
      $rootScope.allowNavigation();
      return;
    }

    if (_preventNavigation && !confirm("You have unsaved changes, do you want to continue?")) {
      event.preventDefault();
    }
    else {
      $rootScope.allowNavigation();
    }
  });
}]);


newsroom.controller('ArticleDetailController', ['$scope', '$rootScope', function ($scope, $rootScope) {
  $scope.$watch('articleForm.$dirty', function (dirty) {
    if (dirty) {
      $rootScope.preventNavigation();
    }
    else {
      $rootScope.allowNavigation();
    }
  });
}]);

{% endhighlight %}

Looks good! However...

## What about navigation outside of your angular app?

As I mentioned above, you'll have to account for when a user tries to close the window or go to somewhere outside of your angular app. We *do* need it to use the same logic and data that we have inside our angular app, though! Here's how you do it:


{% highlight javascript %}
newsroom.run(['$rootScope', '$location', function ($rootScope, $location) {

  var _preventNavigation = false;
  var _preventNavigationUrl = null;

  $rootScope.allowNavigation = function() {
    _preventNavigation = false;
  };

  $rootScope.preventNavigation = function() {
    _preventNavigation = true;
    _preventNavigationUrl = $location.absUrl();
  }

  $rootScope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
    // Allow navigation if our old url wasn't where we prevented navigation from
    if (_preventNavigationUrl != oldUrl || _preventNavigationUrl == null) {
      $rootScope.allowNavigation();
      return;
    }

    if (_preventNavigation && !confirm("You have unsaved changes, do you want to continue?")) {
      event.preventDefault();
    }
    else {
      $rootScope.allowNavigation();
    }
  });

  // Take care of preventing navigation out of our angular app
  window.onbeforeunload = function() {
    // Use the same data that we've set in our angular app
    if (_preventNavigation && $location.absUrl() == _preventNavigationUrl) {
      return "You have unsaved changes, do you want to continue?";
    }
  }

}]);

{% endhighlight %}

Notice how it's using the same `_preventNavigation` and `_preventNavigationUrl` variables? This means that you'll be able to stop the navigation based on the logic that runs inside your angular app.

## Conclusion

Hopefully you got something out of this. Let me know what you think (or how wrong I am!) by hitting me up on [twitter](https://twitter.com/Nitrodist) or emailing me.

There's also a [reddit post](http://www.reddit.com/r/angularjs/comments/1o0rsm/preventing_navigation_in_an_angularjs_project/) that you can use to discuss the article (and I'll answer questions in there too!).
