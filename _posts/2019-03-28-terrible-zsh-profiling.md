---
layout: post

title: "Terrible zsh profiling"
---

Have you ever wanted to profile your `.zshrc` to figure out what's slow when you launch a prompt? 

Or do you find yourself trying to answer with your Google-fu the question of "can you profile zsh startup"? Look no further! This project which is simple enough for you to throw in anywhere and get useful output.

Introducing the [Terrible ZSH Profiler](https://gitlab.com/Nitrodist/terrible-zsh-profiler). It's dead simple, you could have written it in an afternoon (I know I did).

This script is two functions and a smattering of variables. In exchange, you can drop the code in anywhere and begin profiling immediately. You can also edit the code to what you want, it's very simple. Want to add red color when it exceeds X seconds? Go for it!

Example usage in your script:

```sh

# copy library code from `terrible-zsh-profiler.sh` to the top of
# the zsh script you want to profile

sleep 3 && echo "sleeping for 3 seconds and then echoing this echo statement"
profile $LINENO

echo -e "\ndone profiling"
echo -e $profile_report
echo -e "total time executing: ${SECONDS}"
```

Example output:

```
$ ./terrible-zsh-profiler.sh
sleeping for 3 seconds and then echoing this echo statement

done profiling
3.0075800000 terrible-zsh-profiler.sh:37 command: sleep 3 && echo "sleeping for 3 seconds and then echoing this echo statement"

total time executing: 3.0208390000
```
