---
banner_alt: Image of a
banner: https://cdn.pixabay.com/photo/2020/04/05/00/26/web-5004174_960_720.jpg
title: Open IDE Architecture
context: Technology
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

Initially, while I had a basic idea of how the system would work, I had no idea how to go about it. I had never worked on a project of this scale, and had been outlooking for sources of information on how to structure these frameworks. Following is a list of problems I had to solve while working on this project: - Should I use a monorepo or a multi-repo architecture? - How to model the database tables? - How should different tables be connected to each other? - Asynchronous operations and how to handle them? - Difference in execution of languages, both interpreted and compiled - Hosting and handling server heavy operations - Files handling in the code, both binary and source files

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
    <img src="https://cdn.statically.io/gh/thatsameguyokay/images/main/ide.gif" style={{width: "100%", marginBottom: "-20px"}}></img>
    Current flow of execution
</center>

The execution of a full request-response cycle takes place in the following manner: - The user submits the code as request body to the API endpoint - The server captures this request and passes it to the controller - The controller parses the source code and detects the language - Respective functions written in operations directory are called - Each function performs the required operations and returns the output - The response is sent back to the user

#### What happens inside each controller and how do operations operate?

The controller is the first file that is called when a request is made to the server. The controller is responsible for parsing the request body, and detecting the language of the source code. The controller then calls the respective functions in the `operations` folder, and returns the response to the user.

Now, operations are independent of each other and of the platform. If a language needs to be compiled before execution, the control goes to the [compilers](https://github.com/sambhavsaxena/openIDE/tree/main/operations/compilers) directory, where the compiler commands create a binary file for each source.
This binary is stored [here](https://github.com/sambhavsaxena/openIDE/tree/main/operations/binaries). Compilers for each supported language had to be installed on the server before deployment.

Next, these binaries are called by the controller, execution takes place in order of FCFS handled by the server OS, and the output is returned to the user.

If the language is interpreted, the control goes to the [interpreters](https://github.com/sambhavsaxena/openIDE/tree/main/operations/interpreters) directory, where the interpreter commands execute the source code and return the output directly.

After the iterations hit and trials, I finally decided to just stick with a compiler framework, that would be more versatile than most of the existing online compilers.

There are two main components of the system, the frontend and the backend. The frontend is a React app, and the backend is a NodeJS runtime. The frontend is hosted on Vercel, where as, the backend is hosted on Render.

Why choose Render? Because... it is the only free of cost service to host server based apps remotely. I had to use a service like Render because I didn't want to host the server on my local machine, and I didn't want to pay for a service like Heroku. Render is a great service, it's servers are fast, and eats up less bandwidth per request, providing low latency.

As a finished product, it still has several bugs to debug, and several features to add. But, I'm pretty happy with the current architecture, and I'm happy that I got to learn a lot more OS oriented concepts while working on this project.

#### What are the current problems?

The current problems are: - The backend is not very optimized - The server is not secure - The server is vulnurable to crashes - There are tests to be written

#### What's next?

Well, I think I should work on improving and making this IDE more optimal, but as of now, it is far from reality. Frankly, I don't want to raise funds for this product and just keep it as a personal project for now. I also have to think of an idea for [DCRUSTODC](https://github.com/DCRUSTODC), but I'll be working on that later.

Now yet, it's 12AM, I'll probably go listen to [Desi Crime Podcast](https://desicrime.com/) till I sleep.

---
