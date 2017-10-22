# TWEB Project 2017

## Description

This project is divided in two different repository that makes the project work. Here is the repository of the agent you can find the the second repository at the following link:
* https://github.com/CoolPolishGuy/TWEB-GitHub-Analytics-Static

This link above gives the client side which role is to present the data collected.

The client is situed in this repository. Its role is to display information or the data that it has collected from the agent.

Here you are in the repository containing the agent's code. This agent is the entity which directly recuperate data from the GitHub API and which commit and push them on a specific Json file located inside this repository. For this project, the agent is deployed in the cloud on heroku. The app is launch one time per day.

## Data fetched

We have for an owner :

- The top 5 commited repos
- The number of commits each days of week for the last 12 months on the top 1 repos
- The number of commits for the last 12 months split in 4 trimesters

The fetched data will be used and displayed on the client-side.


### Local use
1. Clone the repo.
2. You need to create a file `github-credentials.json` ẁith your username on github and with a valid account token.

    {
    		"username" : "Blais..",
    		"token" : "1234.."
    }
3. Run the agent with node `node src/agent.js`

### Deployment on Heroku

1. Sign in (you need an account)
`heroku login`

2. Create the app
`heroku create`

3. Set environment variables with your credentials
`heroku config:set GITHUB_USERNAME=Blais..`
`heroku config:set GITHUB_TOKEN=1234..`

4. Deploy the app
`git push heroku master`

5. Run it!!
`heroku run agent`

## Authors

Jérémie Zanone and Wojciech Myszkorowski
