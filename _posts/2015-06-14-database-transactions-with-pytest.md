---
layout: post

title: Database Transactions With pytest
---

For past few years I've been primarily a ruby programmer. In the ruby ecosystem, testing is seen as pretty important and I wanted to have the same tooling in python.

[Where I work](http://mobile.thescore.com/), we use primarily use rspec in conjunction with Rails. The combo comes with a few things by default:

1. Test discovery under `spec/` or `test/`
2. Automatic database transaction support per test

We have a old, custom Python project that I've been working with and slowly modernizing. The need to unit tests came up and I evaluated a few options. I ended up choosing [pytest](https://pytest.org/) as it seemed to be most modern and popular framework.

By default, pytest is configured to discover tests in *all* directories and subdirectories. So, while it does work, it can be slow (because it crawls everything) and it can discover tests that it shouldn't (such as a vendored code).

To fix this, I ended up using the `norecursedirs` option. This option tells pytest which directories *not* to recurse into (no option exists to tell it to only go into certain directories). Here's a sample config:

{% highlight ini %}
# setup.cfg
[pytest]
norecursedirs = .git vendor my-project/lib my-project/helpers docs config log tmp\*
{% endhighlight %}

If you follow a [standard-ish way python projects are structured](http://stackoverflow.com/a/5998845/269694), then you can enumerate all of the directories in my-project except `tests`. The reason why this is necessary is because norecursedirs matches apply to every file, so say, using the above example, you wanted to have a directory called `config` in `my-project/tests/config/my_test.py`, you can't because `config` is somewhere in the path.

To solve #2, it got... a bit tricky. We utilized standard xUnit style tests, so our tests would look like this:

{% highlight python %}
class TestWidget:

    def setup_method(self, method):
        self.subject = Widget()

    def test_can_get_meaning_of_life(self):
        assert self.subject.get_meaning_of_life() == 42
{% endhighlight %}

Say that instantiating `Widget` actually wrote to the database. At this point, the widget is going to be saved in the database and subsequent tests could error out because they rely on having no widgets in the database.

Our first solution used inheritance like this:

{% highlight python %}
# tests/helper.py
class BaseTest:
    def setup_method(self, method):
        orm.session.begin()

    def teardown_method(self, method):
        orm.session.rollback()

# tests/unit/widget_test.py
from tests.helper import BaseTest

class TestWidget(BaseTest):

    def setup_method(self, method):
        super(BaseTest, self).setup_method(method)
        self.subject = Widget()

    def test_can_get_meaning_of_life(self):
        assert self.subject.get_meaning_of_life() == 42

{% endhighlight %}

This works for the most part, except that `teardown_method` does not get called if something failed in `setup_method` [by design since pytest 2.4](https://pytest.org/latest/announce/release-2.4.0.html) (see 'issue322'). This means that `orm.session.rollback()` had a chance to not be called.

### Enter Pytest Fixtures

While the classic xUnit style doesn't work so well, we do have an alternative: [pytest fixtures](https://pytest.org/latest/fixture.html).

What are these fixtures? Well, they're basically dependencies that you can require for your tests. Here's how our code can look now:

{% highlight python %}
# tests/helper.py
@pytest.fixture()
def db_transaction(request):
    orm.session.begin()

    def fin():
        orm.session.rollback()

    request.addfinalizer(fin)

    return orm.session

# tests/unit/widget_test.py
class TestMyWidget:

    def test_my_widget(self, db_transaction):
        print "\nin passing test\n"

    def test_my_failing_widget(self, db_transaction):
        print "\nin failing test\n"
        raise Exception()
{% endhighlight %}

The extended example and output [can be found here](https://gist.github.com/Nitrodist/60ced9ca02d9e56cde42).

The downside of this technique is that we have to remember to opt-in to every test by specifying `db_transaction` as one of the arguments. To get around this issue, we tried combining `autouse` and classes:

{% highlight python %}
# tests/helper.py
class BaseTest:
    # prefixed with '_' since autouse fixtures are executed alphabetically
    # see http://stackoverflow.com/a/28593102/269694
    @pytest.fixture(autouse=True)
    def _wrap_test_in_transaction(self, request):
        orm.session.begin()

        def fin():
            orm.session.rollback()

        request.addfinalizer(fin)

# tests/unit/widget_test.py
from tests.helper import BaseTest

class TestWidget(BaseTest):

    @pytest.fixture(autouse=True)
    def before(self, request):
        self.subject = Widget()

    def test_can_get_meaning_of_life(self):
        assert self.subject.get_meaning_of_life() == 42
{% endhighlight %}

That's it! No other special tricks.


### Conclusion

This took a bit of thinking to come up with, but maybe you or someone you know has a better way of writing tests with database transactions in pytest. Let me know and leave a comment below, [shoot me an email](mailto:me@markcampbell.me), or [tweet at me](https://twitter.com/intent/tweet?text=Hey%20@Nitrodist,%20you%27re%20wrong%20about%20pytest!) -- I promise I won't bite!
