---
banner_alt: Image of a 
banner: https://cdn.pixabay.com/photo/2020/04/05/00/26/web-5004174_960_720.jpg
title: Open IDE Architecture
title_prefix: Development
description: Understanding the architecture of an online compiler.
date: '2023-04-01'
---
--- 

#### What is Open IDE?
I had been looking for a new project idea for a very long time, and last week while discussing with people the scope of such an ambitious project, we got settled on creating a UI library for React. This was supposed to have basic wireframes, snippets and components, pretty much as the existing CSS libraries like Tailwind have. The only problem was that things like this already existed in the market and were very much abundant, and most of them are open source. Also, since a very long time, there hadn't been a week without a new JS / CSS library being released. So, I decided to go for something different, and that's when we came across the idea to create an open-source online compiler system (soon to be), that later came to be known as [Open IDE](https://openide.vercel.app/).

<center>
    <img src="https://cdn.statically.io/gh/thatsameguyokay/images/main/openide.png" style={{width: "90%", marginBottom: "-20px"}}></img>
    Home of Open IDE
</center>

#### What's the idea behind complexity of this architecture?
Initially, while I had a basic idea of how the system would work, I had no idea how to go about it. I had never worked on a project of this, and had been outlooking for sources of information on how to structure these frameworks. Following is a list of problems I had to solve while working on this project:
    - Should I use a monorepo or a multi-repo architecture?
    - How to model the database tables?
    - How should different tables be connected to each other?
    - Asynchronous operations and how to handle them?
    - Difference in execution of languages, both interpreted and compiled
    - Hosting and handling server heavy operations
    - Files handling in the code, both binary and source files

Before I finally started committing to the repo, I had already build several iterations of the model. Some of them had a monorepo architecture, some had a multi-repo architecture, some had a single database, some had multiple databases, some had a single server, some had multiple servers, and so on. I had to go through a lot of iterations before I finally settled on the current architecture.

<center>
    <img src="https://cdn.statically.io/gh/thatsameguyokay/images/main/old-ide.png" style={{width: "100%", marginBottom: "-20px"}}></img>
    One of the iterations operating like that of an online judge
</center>

#### What is the current architecture?

Let's start with the file structure.


```bash
.
├── api
│   ├── controllers
│   │   └── code.js
│   ├── code
│   │   ├── save-file
│   │   ├── compile
│   │   ├── execute
│   │   ├── run script
│   │   └── respond
│   └── index.js
├── operations
│   ├── binaries
│   │   ├── bin
│   │   └── jar
│   ├── compilers
│   │   ├── cpp.js
│   │   └── java.js
│   ├── interpreters
│   │   ├── py.js
│   │   └── js.js
│   └── files
│       ├── main.cpp
│       ├── main.py
│       ├── main.java
│       └── main.js
├── routes
│   └── code
│       └── submitRoutes.js
root
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── index.js


```

This is the file structure I had for the backend initially, but now has some tweaks according to the current architecture. The `api` folder contains all the API routes, and the `operations` folder contains all the operations that are performed on the files. The `routes` folder contains the routes for the API, and the `root` folder contains the `index.js` file, the `package.json` file, the `.env` file, and the `README.md` file.


#### How does network-system calls flow?

<center>
    <img src="https://cdn.statically.io/gh/thatsameguyokay/images/main/ide.gif" style={{width: "110%", marginBottom: "-20px"}}></img>
    Current flow of execution
</center>

The execution of a full request-response cycle takes place in the following manner:
    - The user submits the code as request body to the API endpoint
    - The server captures this request and passes it to the controller
    - The controller parses the source code and detects the language
    - Respective functions written in operations directry are called
    - Each function performs the required operations and returns the output
    - The response is sent back to the user

After the iterations hit and trials, I finally decided to just stick with a compiler framework, that would be more versatile than most of the existing online compilers.

There are two main components of the system, the frontend and the backend. The frontend is a React app, and the backend is a NodeJS app. The frontend is hosted on Vercel, and the backend is hosted on Render. 

Why choose Render? Because it's servers already have compilers like `Javac`, `GCC`, `G++`, `Python3`, `NodeJS` and `Java` installed, and it's servers are effectively fast.

As a finished product, it still has several bugs to debug, and several features to add. But, I'm pretty happy with the current architecture, and I'm that I got to learn a lot more OS oriented concepts while working on this project.

#### What are the current problems?
The current problems are:
    - The frontend is not responsive
    - The backend is not optimized
    - The server is not secure
    - The server is vulnurable to crashes
    - The backend is not modular
    - There are tests to be written

#### What's next?
Well, I think I should work on improving and making this IDE more optimal, but as of now, it is far from reality. Frankly, I don't want to raise funds for this product and just keep it as a personal project for now. I also have to think of an idea for [DCRUSTODC](https://github.com/DCRUSTODC), but I'll be working on that later.

For now, I'll go listen to [Desi Crime Podcast](https://desicrime.com/) till I sleep.

---
