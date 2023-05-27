# Serverless GitHub Repository Fetcher Microservice

This repository implements a couple of serverless Firebase Cloud Functions using ExpressJS to fetch all of my public GitHub repository data. I use this data to power [my professional blog website](https://alitursucular.github.io/) that is hosted on GitHub Pages.

I could have simply fetched my repository data on the client. However, _for unauthenticated requests, the rate limit allows for up to 60 requests per hour. Unauthenticated requests are associated with the originating IP address, and not the person making requests.<sup>1</sup>_. To stay on the safe side, I decided to create this microservice and get this data from my cloud functions.

In essence, this microservice offers three functions. _alitursucularGithubRepos_, _alitursucularGithubRepoByName_ and a scheduled _fetchAlitursucularGithub_ function that updates Firestore every two hours. I am using `@octokit/rest` package for fetching my public repositories from GitHub.

_<sup>1</sup>_ [GitHub rate limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api?apiVersion=2022-11-28#rate-limiting)
