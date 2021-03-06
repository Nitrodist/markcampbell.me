---
layout: post

title: "csv_to_gsheet command released!"
---

Please welcome to the programming world the `csv_to_gsheet` command!

With this command, you can import your csv files to Google Sheets without going through Google's CSV import wizard.

Install it with `gem install csv_to_gsheet`.

Using it requires [creating an OAuth2 app for Google Services](https://developers.google.com/identity/sign-in/web/sign-in) and using that app's credentials.json file locally. After that, do this:

```
$ csv_to_gsheet ./my_data.csv

# <web page opens with newly created google sheet>
```

Here's a demo of it in action:

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/vvOoG__E1gk" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Want to know more? [Source code here](https://gitlab.com/Nitrodist/csv_to_gsheet).
