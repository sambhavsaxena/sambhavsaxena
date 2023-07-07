---
banner_alt: Some random engineering shit
banner: https://images.unsplash.com/photo-1632749042303-7f7a18ed6ff0
title: Tweaks I make around the web
title_prefix: Technology
description: How I take every virtual obstacle on my ego and find a way to resolve.
date: '2022-10-09'
likes: 0
---
--- 

#### Which tweaks are valid tweaks?
When you start with your development career, your PC becomes your playground, and whatever tweaks you play around with your data are termed as valid and valued.
But why should one play around with the technologies made by best of developers?
Actually, being created by the best of developers itself increases the valuation of the product. And finding a flaw out of such products or tweaking around it unveils new possibiities which make modern day bug bounties possible.

#### Here is an example-
While developing this application with one of my colleagues, so we were creating a chat application to support several participants at once and we also wished that users were able to send text messages with absolute efficiency. For this to happen, we wanted the messages to be sent by pressing both the 'Enter' key as well as the UI button. Now, to capture button events, we have the `event.key` attribute to provide with the key code, which takes up event as a prop. But in case of button clicks, we have an `onClick` event which doesn't take event as a prop. How to manage a single function thereafter to accept the events or not at the same time dynamically?

I had a clever idea, what if I pass a custom event object as a prop to the `onClick` event? Like JS is a flexible and weakly typed language, this must work.

So I got hold of the keyboard and did this:
<center>
    <img src="https://cdn.statically.io/gh/thatsameguyokay/images/main/talkative.png" style={{width: "99%", marginBottom: "-20px"}}></img>
    [Github URL here](https://github.com/pardhan007/Talk-A-Tive/blob/main/frontend/src/components/SingleChat.js#L101)
</center>


#### Here's another one-
So last week, I was watching a tutorial by [Aditya Verma](https://www.linkedin.com/in/adityaverma1999/) and I liked it very much so I started scrolling through the comments looking for his appreciations. Among those, I found this really interesting comment which led me to this account, and out of curiosity, I wanted to open up the full screen image(me being a creep). But turns out, YouTube wants someone to stay away from the data that has already been sent to their PC.

Turns out this someone is someone tweaking around the web for several years now, so this is what he did:
<center>
    <img src="https://cdn.statically.io/gh/thatsameguyokay/images/main/stalk.gif" style={{width: "99%", marginBottom: "-20px"}}></img>
    Your bad YouTube, come again some other day.
</center>

So just like this, keeping to try out different things on your machine makes it even more interesting than learning something and then trying it out.

Keep track of your tweaks. Love.

---
