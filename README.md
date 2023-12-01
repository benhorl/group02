Group2

Restaurant Reviews

Description: Restaurant Reviews is an application that allows users to search for different types of food and/or specific restaurants to leave reviews or discover new restaurants to visit. You are also able to add restaurants to your wishlist and view other people's profiles that use Restaurant reviews. 

Contributors: Jignesh Mohanty, Levi Rotte, Ben Horlbeck, Joseph Gildhouse, Trip Szewczak

Technology Stack:
- VCS Repository: GitHub
- Database: PostgreSQL
- Container Control: Docker
- Application Server: NodeJS

External APIs:
- Yelp Fusion

Testing Tool: Chai, Mocha

Deployment Environment: Azure

UI Tools: HTML, EJS

Pre-requisites:
- Must have docker
- Search Engine

Run Intructions:

1. Either download the respository and unzip the files, or clone the repository
    - The repository can be downloaded by clicking the green Code button and then pressing download zip
    - The repository can be cloned using the following command: ```git clone git@github.com:benhorl/group02.git```
2. Navigate to the Project code directory using cd commands in your terminal
3. Open the file docker-compose.yaml and ensure line 21 reads "- '3000:3000'" so the application can be deployed locally (the .yaml file may instead read "- ':3000'", which may cause crashing if deployed locally)
4. Boot up Docker
5. In terminal run docker compose up
6. Navigate in a search engine to this localhost page (http://localhost:3000/)
7. To shut down the website, run ```docker-compose down``` in your terminal
8. If you want to clear the databases of their stored information, run ```docker-compose down --volumes``` in your terminal

How to run tests:

All tests will be run automatically through mocha and chai when starting the application.

Link:
