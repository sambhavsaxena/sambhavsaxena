---
banner_alt: A security vector thumbnail from pixabay
banner: https://cdn.pixabay.com/photo/2017/02/19/23/10/finger-2081169_960_720.jpg
title: Creating a passwordless auth system in NodeJS
title_prefix: Development
description: Implementing a passwordless auth architecture during my internship.
date: '2022-12-03'
---
---

#### Is it okay to share what I did during my internship period?

Ask your lead and you're good to go. Save and post screenshots of your PM allowing you on public blogs so you can be sure. (Kidding)

Just ask your project manager, recruiter about the blog you'll be writing, read any terms regarding the same, and you'll be good to go.

<center>
    <img src="https://cdn.statically.io/gh/thatsameguyokay/images/main/chats.png" style={{width: "100%"}}></img>
</center>


#### How far does this make things easy for the users?

If you'd ever used [Slack](https://slack.com/intl/en-in), you'd know how the sign in works. You give your email ID, they send you an email, and you are logged in as soon as you click the URL sent with the mail. Plus you are now verified. The onboarding could be done later.

Security and ease of access are subjective and depends on several factors like what all resources are you allowing your users to access, how difficult is it to make the access available and stuff like that. In the end, this boils down to checks and balances between security and ease of resource access.

Now let's get into the technicalities. And let's break it down into parts: 
 - Get the email and send verification URL.
 - Verify the user and connect to the database for onboarding.
 - Get input data from as headers for onboarding, and log the user in.

#### Get the email and send verification URL

On the frontend, have a beautiful form, or just an input bar (but it should be beautiful), to get the email. Send the form data as body of the post request. A better practice would be to verify if the email is valid, with syntax as well as with servers. And remember for now, whenever I say error, an error code should be returned on the frontend, rather than throwing an error. For invalid email, the code should be `400`.

To integrate user login and signup, and to verify using two factors everytime a user logs in, create a user in the database at this point, and do the rest later. This would help you keep track how many users have attempted verification, and would take up less data from your database, instead of creating different tables for both verified users and unverified users.

Also to keep it secure, the token that we send in the email for verification is not generated from the email, but from the [userID](https://www.mongodb.com/docs/manual/reference/method/ObjectId/) that has been assigned to the user object by the database. Keep the expiry time small, say 5m or something.

Finally, send the token on `GET: auth/login` route as query, so that the server can retrieve it on the backend for verification.

Part 1 is done.

#### Verify the user and connect redirect to the database for onboarding

Following is the email received on the mail ID provided by the user.
<center>
    <img src="https://cdn.statically.io/gh/thatsameguyokay/images/main/email.png" style={{width: "100%"}}></img>
</center>

You have the token you sent over the mail, from the query headers of the request that you just received on the backend when someone user clicked on that URL.
Verify the token, and use `ignoreExpiration: true` flag in order to verify expired tokens and prevent any errors.

Do rest of the validation on your own, which might include the token being expired when the user clicked on the link. Remember, security is the key.

We can have an `isVerified` flag for each user object, so that only verified users can onboard. Which I didn't check practically while working because my PM didn't ask me to:)

Remember to send an auth token to the user cookies, and keep the expiry long (around a month will be fine), so that with each subsequent request from your domain, you get back the cookie for verification if its a request from a valid user.

Almost everything is now done, the user is verified. Redirect them to a dashboard page where they could fill in the information you might need either ways.

#### Get input data from as headers for onboarding, and log the user in

Check the cookies for authentication token that have to be there after verification has been done, do the formalities, check for expiry and stuff like that, get the user data from the body params and call: 

`await User.findByIdAndUpdate(decodedUser.id, { ...req.body })`

This would save the user data into the database. Do some brainstorming with session management and log the user in (SAFELY). Remember to send status response every time you perform a check on the user data. The authentication is now successful.

<center>
    <span style={{color: "green"}}>status: 200</span>
</center>

---
