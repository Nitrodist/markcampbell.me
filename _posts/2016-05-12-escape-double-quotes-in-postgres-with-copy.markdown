---
layout: post

title: Escape double quotes in Postgres with COPY
---

The title of this post is actually what I googled when I was running into a specific problem where a CSV file I was importing had double quotes in the file like this:

```
# my_file.csv
First Field|Second Field|Third Field
Foo"|Bar|Baz
```

With a Postgres table like this (I'm using 9.5.1):

```sql
-- create_table.sql
CREATE TABLE "My_Table"
(
  "First Field" char(50),
  "Second Field" char(50),
  "Third Field" char(50)
);
```

Now, most CSV implementations will treat the double quote as a way to quote things together (in fact, [Postgres goes into great detail on this about the CSV format](http://www.postgresql.org/docs/9.2/static/sql-copy.html)) so when you try to import the file, you'll just get this cryptic error:

```
my_database=# COPY "My_Table" FROM '/Users/mark.campbell/my_file.csv' DELIMITER '|' CSV HEADER;
ERROR:  unterminated CSV quoted field
CONTEXT:  COPY My_Table, line 4: "Foo"|Bar|Baz
"
Time: 1.887 ms
```

The solution to this is to escape it with... you guessed it, *4* double quotes (no, I'm not kidding). Here's the updated file:

```
# my_file.csv
First Field|Second Field|Third Field
Foo""""|Bar|Baz
```

Here's it working:

```
my_database=# COPY "My_Table" FROM '/Users/mark.campbell/my_file.csv' DELIMITER '|' CSV HEADER;
COPY 1
Time: 1.557 ms
my_database=# select * from "My_Table";
-[ RECORD 1 ]+---------------------------------------------------
First Field  | Foo"
Second Field | Bar
Third Field  | Baz

Time: 0.615 ms
```

Alright, that's all for now!
