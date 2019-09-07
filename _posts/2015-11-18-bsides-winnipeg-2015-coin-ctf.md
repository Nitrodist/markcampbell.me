---
layout: post

title: BSides Winnipeg 2015 Coin CTF Writeup
---

*If you want to see more of the code, checkout [the github repository for this puzzle](https://github.com/Nitrodist/bsideswpg-coin-puzzle).*

*Big thanks to [Paul](https://twitter.com/ultramegaman) and [Michael Loney](https://twitter.com/Dragon_Eater) for working with me on the puzzle; I couldn't have done it without them! Also, thanks to [Mak Kolybabi](https://twitter.com/mak_kolybabi) for creating the puzzle in the first place!*

At 2015 edition of BSides Winnipeg, there was a [capture-the-flag](https://en.wikipedia.org/wiki/Capture_the_flag#Computer_security)/puzzle based on a physical coin:

![Coin Puzzle Image](/assets/images/2015-11-18-bsides-winnipeg-2015-coin-ctf/coin.jpg "Coin Puzzle Image")

From there, we see a few things:

* The letters QR in the center
* A C-clamp/vise
* Four rows of letters, numbers, and symbols

The four rows of characters appear to be [base64 encoded](https://en.wikipedia.org/wiki/Base64), so that will probably be our first step.

The C-clamp/vise can be associated with compression -- in fact, if we go halfway down [zlib's website](http://zlib.net/), we'll see that they have an image of a vise. Interesting!

The 'QR' lettering probably refers to a [QR code](https://en.wikipedia.org/wiki/QR_code), so what are the puzzle makers trying to say here? That the QR code is within the compression somehow? Read on!

## Step 1 - base64 decode the ciphertext

The text of the coin is a base64 encoded string. The first thing you should do is transcribe the text from the coin to a file on your computer. If you don't want to do that, just use the `coin_text_as_one_line.txt` file in this repo. Here's the text:

```
eJwdjjEKRTEIBIW0Qq4i2ApePWAreJWArbA/7y9bDbswGC0A3BiqczbplVXpPN073CZvlatpP5gfbDfK/1JkYfK7q+LSYnoJItRt9R7Lc02CbbPErtfVN/ps4cqVS1sTHNwecmjbSVolihmFwxlJUd0kPVMZIG3B4Ul7ErrXg0NX28mY6k6QjgsGD+HJnh/LpXbz
```

Once it's in the file, we can decode it by piping the text to the `base64` command:

```
$ cat coin_text_as_one_line.txt | base64 --decode > coin_text_base64_decoded.txt
```

If we try to `cat` that file to our terminal, we get a bunch of weird characters -- so it's just a stream of bytes now.

## Step 2 - investigate the bytestream

Here's what the bytestream looks like as a hexdump:

```
$ hexdump coin_text_base64_decoded.txt

0000000 78 9c 1d 8e 31 0a 45 31 08 04 85 b4 42 ae 22 d8
0000010 0a 5e 3d 60 2b 78 95 80 ad b0 3f ef 2f 5b 0d bb
0000020 30 18 2d 00 dc 18 aa 73 36 e9 95 55 e9 3c dd 3b
0000030 dc 26 6f 95 ab 69 3f 98 1f 6c 37 ca ff 52 64 61
0000040 f2 bb ab e2 d2 62 7a 09 22 d4 6d f5 1e cb 73 4d
0000050 82 6d b3 c4 ae d7 d5 37 fa 6c e1 ca 95 4b 5b 13
0000060 1c dc 1e 72 68 db 49 5a 25 8a 19 85 c3 19 49 51
0000070 dd 24 3d 53 19 20 6d c1 e1 49 7b 12 ba d7 83 43
0000080 57 db c9 98 ea 4e 90 8e 0b 06 0f e1 c9 9e 1f cb
0000090 a5 76 f3
0000093
```

The image inside of the coin has a C-clamp/vise -- maybe this indicates that it's compressed?

Files usually have certain byte sequences at the beginning or end of the file. The first four [nibbles](https://en.wikipedia.org/wiki/Nibble) are this: `78 9c`. I ended up googling it and the first result was this Stack Overflow question: "[What does a zlib header look like?](http://stackoverflow.com/questions/9050260/what-does-a-zlib-header-look-like)" -- sounds like we have a zlib bytestream! As it turns out, `78 9c` is the byte sequence for 'Default compression' in zlib.

## Step 3 - decompress the bytestream

Let's try decompressing it with a simple python program (`decompress_zlib.py`):

```python
#!/usr/bin/env python

import zlib

filename = 'coin_text_base64_decoded.txt'
data = open(filename).read()

# comma at the end means that it won't print a newline
print(zlib.decompress(data)),
```

One of the features of zlib is that the last 4 bytes of the stream are reserved for a checksum. This was very useful because we failed the checksum the first few times. This was because I had...

1. transcribed an uppercase 'N' as a lowercase one and...
2. I could not distinguish between the 7 `1` and `l` characters **at all**

Special thanks to [Michael Loney](https://twitter.com/Dragon_Eater) and [Mak Kolybabi](https://twitter.com/mak_kolybabi) for transcribing the `l` and `1` characters correctly!

Once we had the correct text, we were able to see the decompressed version:

```
$ python decompress_zlib.py | hexdump

0000000 ff fc 33 cf ff ff ff 0c f3 ff fc 00 cf c0 c0 0f
0000010 00 33 f0 30 03 cf cc 3f 0c fc f3 f3 0f c3 3f 3c
0000020 fc cc f0 cf cf 3f 33 3c 33 f3 cf cc 3f cc fc f3
0000030 f3 0f f3 3f 3c 00 cc c0 c0 0f 00 33 30 30 03 ff
0000040 fc cc cf ff ff ff 33 33 ff f0 00 03 0c 00 00 00
0000050 00 c3 00 00 ff cf f0 f3 33 3f f3 fc 3c cc c0 f0
0000060 3c 30 c3 0c 3c 0f 0c 30 c3 0f cf c3 0f cf 03 f3
0000070 f0 c3 f3 c0 0f 30 0c cf cc 03 cc 03 33 f3 33 cc
0000080 ff 0c c3 0c f3 3f c3 30 c0 00 0f 3c c0 cc 00 03
0000090 cf 30 33 ff fc fc 33 ff 3f ff 3f 0c ff cc 00 c3
00000a0 cf f3 f3 00 30 f3 fc fc cf cc c3 ff 00 33 f3 30
00000b0 ff c0 0c fc cc 3c 0f f3 3f 33 0f 03 fc cf cc fc
00000c0 00 f0 33 f3 3f 00 3c 0c 00 cf f0 fc c3 00 33 fc
00000d0 3f 30 ff fc ff 33 f3 3f ff 3f cc fc c0 0a
00000de
```

No errors! Seems like we're on the right track.

## Step 4 - find the QR code

Hmm... seems kind of weird that the text has only these nibbles in it: `F` `0` `3` `C`.

Say that they translate to these sequences based on binary:

* Hexadecimal: `F` Binary: `1111` Decimal: `15`
* Hexadecimal: `0` Binary: `0000` Decimal: `0`
* Hexadecimal: `3` Binary: `0011` Decimal: `3`
* Hexadecimal: `C` Binary: `1100` Decimal: `13`

We could probably take the binary output and display it somehow! Specifically, we'll only display the `11` and `00` half-nibbles.

Let's clean up the output a bit before we do anything else:

```
python decompress_zlib.py | hexdump | perl -pe 's!^........?!!g' | perl -pe 's! !!g'
fffc33cfffffff0cf3fffc00cfc0c00f
0033f03003cfcc3f0cfcf3f30fc33f3c
fcccf0cfcf3f333c33f3cfcc3fccfcf3
f30ff33f3c00ccc0c00f0033303003ff
fccccfffffff3333fff000030c000000
00c30000ffcff0f3333ff3fc3cccc0f0
3c30c30c3c0f0c30c30fcfc30fcf03f3
f0c3f3c00f300ccfcc03cc0333f333cc
ff0cc30cf33fc330c0000f3cc0cc0003
cf3033fffcfc33ff3fff3f0cffcc00c3
cff3f30030f3fcfccfccc3ff0033f330
ffc00cfccc3c0ff33f330f03fccfccfc
00f033f33f003c0c00cff0fcc30033fc
3f30fffcff33f33fff3fccfcc00a
00000de
```

Since it's a QR code, let's convert each `11` half-nibble to two `█` characters and each `00` half-nibble to two ` ` characters. Here's how to do it with a series of `sed` commands:

```
$ python decompress_zlib.py | \
         hexdump | \
         perl -pe 's!^........?!!g' | \
         perl -pe 's! !!g' | \
         sed 's!f!████!g' | \
         sed 's!c!██  !g' | \
         sed 's!3!  ██!g' | \
         sed 's!0!    !g'

██████████████    ██  ████  ████████████████████████████    ██  ████  ████████████████          ██  ██████      ██          ████
          ██  ██████      ██          ████  ██████  ██    ██████    ██  ██████  ████  ██████  ██    ██████    ██  ██████  ████  
██████  ██  ██  ████    ██  ██████  ████  ██████  ██  ██  ████    ██  ██████  ████  ██████  ██    ████████  ██  ██████  ████  ██
████  ██    ████████  ██  ██████  ████          ██  ██  ██      ██          ████          ██  ██  ██      ██          ██████████
██████  ██  ██  ██  ████████████████████████████  ██  ██  ██  ██████████████                  ██    ██                          
        ██    ██                ██████████  ████████    ████  ██  ██  ██  ██████████  ████████    ████  ██  ██  ██      ████    
  ████    ██    ██    ██    ██    ████      ████    ██    ██    ██    ██    ██████  ██████    ██    ██████  ████      ██████  ██
████    ██    ██████  ████          ████  ██        ██  ██  ██████  ██        ████  ██        ██  ██  ██████  ██  ██  ████  ██  
████████    ██  ██    ██    ██  ████  ██  ████████    ██  ██    ██                  ████  ████  ██      ██  ██                ██
██  ████  ██      ██  ████████████████  ██████    ██  ██████████  ██████████████  ██████    ██  ██████████  ██          ██    ██
██  ████████  ██████  ██          ██    ████  ████████  ██████  ██  ██████  ██  ██    ██████████          ██  ██████  ██  ██    
██████████          ██  ██████  ██  ██    ████      ████████  ██  ██████  ██  ██    ████      ████████  ██  ██████  ██  ██████  
        ████      ██  ██████  ██  ██████          ████      ██          ██  ████████    ██████  ██    ██          ██  ████████  
  ██████  ██    ██████████████  ████████  ██  ██████  ██  ██████████████  ████████  ██  ██████  ██          a

```

Looks weird, doesn't it? OK, let's assume that the image is *square*. What's the nearest square of the characters we have now? Let's count it via the `wc -c` command and make sure to remember to remove any newlines from the `hexdump` command by piping the output to `tr -d '\n'`.

We used 'X' characters instead of `█` in this case because `wc` thinks each `█` is 2 bytes/characters so that would double the expected number of bytes/characters. Here's how we counted the characters:

```
$ python decompress_zlib.py | \
         hexdump | \
         perl -pe 's!^........?!!g' | \
         perl -pe 's! !!g'     | \
         sed 's!f!XXXX!g' | \
         sed 's!c!XX  !g' | \
         sed 's!3!  XX!g' | \
         sed 's!0!    !g' | \
         tr -d '\n' | \
         wc -c

1773
```

The nearest square root of `1773` is `42`, so we'll assume that it's a 42x42 image.

Let's dump the characters to a file (`qr_without_newlines.txt`) so that we can use it more easily:

```
$ python decompress_zlib.py | \
         hexdump | \
         perl -pe 's!^........?!!g' | \
         perl -pe 's! !!g'     | \
         sed 's!f!████!g' | \
         sed 's!c!██  !g' | \
         sed 's!3!  ██!g' | \
         sed 's!0!    !g' | \
         tr -d '\n' > qr_without_newlines.txt
```

So let's print out an image with newlines every 42 characters (excuse the ruby one-liner):

```
$ cat qr_without_newlines.txt | ruby -e 'ARGF.read.each_char.with_index{|char, i| if i % 42 == 0; print "\n"; end; print char }'


██████████████    ██  ████  ██████████████
██████████████    ██  ████  ██████████████
██          ██  ██████      ██          ██
██          ██  ██████      ██          ██
██  ██████  ██    ██████    ██  ██████  ██
██  ██████  ██    ██████    ██  ██████  ██
██  ██████  ██  ██  ████    ██  ██████  ██
██  ██████  ██  ██  ████    ██  ██████  ██
██  ██████  ██    ████████  ██  ██████  ██
██  ██████  ██    ████████  ██  ██████  ██
██          ██  ██  ██      ██          ██
██          ██  ██  ██      ██          ██
██████████████  ██  ██  ██  ██████████████
██████████████  ██  ██  ██  ██████████████
                  ██    ██
                  ██    ██
██████████  ████████    ████  ██  ██  ██
██████████  ████████    ████  ██  ██  ██
    ████      ████    ██    ██    ██    ██
    ████      ████    ██    ██    ██    ██
    ██████  ██████    ██    ██████  ████
    ██████  ██████    ██    ██████  ████
        ████  ██        ██  ██  ██████  ██
        ████  ██        ██  ██  ██████  ██
  ██  ████  ██  ████████    ██  ██    ██
  ██  ████  ██  ████████    ██  ██    ██
                ████  ████  ██      ██  ██
                ████  ████  ██      ██  ██
██████████████  ██████    ██  ██████████
██████████████  ██████    ██  ██████████
██          ██    ████  ████████  ██████
██          ██    ████  ████████  ██████
██  ██████  ██  ██    ██████████
██  ██████  ██  ██    ██████████
██  ██████  ██  ██    ████      ████████
██  ██████  ██  ██    ████      ████████
██  ██████  ██  ██████          ████
██  ██████  ██  ██████          ████
██          ██  ████████    ██████  ██
██          ██  ████████    ██████  ██
██████████████  ████████  ██  ██████  ██
██████████████  ████████  ██  ██████  ██
        a
```

Looks like a QR code! Let's set our terminal up to display it better so that we can use a QR scanner on our phone to scan it.

Adjust the foreground and background color:

![Adjust FG and BG colors in terminal](/assets/images/2015-11-18-bsides-winnipeg-2015-coin-ctf/adjust-fg-and-bg-color.jpg "Adjust FG and BG colors in terminal")

Adjust vertical spacing:

![Adjust vertical spacing](/assets/images/2015-11-18-bsides-winnipeg-2015-coin-ctf/vertical-spacing.jpg "Adjust vertical spacing")

Here's the result!

![Result of terminal adjustments](/assets/images/2015-11-18-bsides-winnipeg-2015-coin-ctf/result.jpg "Result of terminal adjustments")

# Step 5 - get the QR code text

I used my Android phone with a program called 'QR Droid' to get the text:

![QR text result](/assets/images/2015-11-18-bsides-winnipeg-2015-coin-ctf/Screenshot_20151118-082609.png "QR text result")

Sweet, we got the flag! Or, specifically, we got `flag: 🚩🔜💻`


## Bonus question or something?

On the badges, there's a 32 character code:

```
4dc357d7652464d4238a7543501045eb
```

This sequence could be used... as a decryption key? Whaaaaa???? This sequence looks strikingly like a md5 sum.

On the program, there's *another* 32 character code:

```
3e930a8b0cb5057027a6498265fbf67f
```

Not sure what they were for, but they were there!

## Conclusion

It was a lot of fun figuring out this puzzle and I got a cool keepsake at the end of it. I also got [a sweet signed copy of 'Spam Nation' by Brian Krebs](https://twitter.com/Elmwoodie/status/666000022249410560) as a prize! Next year's BSides Winnipeg is going to be a CTF exclusively and the 2017 edition will be a conference. See all of you there next year!
