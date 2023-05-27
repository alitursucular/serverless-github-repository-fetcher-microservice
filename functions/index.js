const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit();

admin.initializeApp();
const db = admin.firestore();

const app = express();

app.use(cors({ origin: true }));

const REPO_OWNER = "alitursucular";
const ALITURSUCULAR_GITHUB_COLLECTION = "alitursucularGithub";

const fetchRepos = async () => {
    try {
        const { data } = await octokit.repos.listForUser({
            username: REPO_OWNER
        });

        const batch = db.batch();

        for (const repo of data) {
            const { data: readme } = await octokit.repos.getReadme({
                owner: REPO_OWNER,
                repo: repo.name
            });

            const readmeObj = await octokit.request(readme.download_url);

            const docRef = db.collection(ALITURSUCULAR_GITHUB_COLLECTION).doc(repo.name);

            batch.set(
                docRef,
                {
                    name: repo.name,
                    description: repo.description,
                    readme: readmeObj,
                    topics: repo.topics,
                    visibility: repo.visibility,
                    html_url: repo.html_url
                },
                { merge: true }
            );
        }
        await batch.commit();
    } catch (error) {
        console.error(`fetchRepos function failed: ${error}`);
    }
};

app.get("/alitursucularGithubRepos", async (req, res) => {
    try {
        let collectionRef = db.collection(ALITURSUCULAR_GITHUB_COLLECTION);
        let snapshot = await collectionRef.get();

        if (snapshot.empty) {
            await fetchRepos();
            collectionRef = db.collection(ALITURSUCULAR_GITHUB_COLLECTION);
            snapshot = await collectionRef.get();
        }

        const data = snapshot.docs.map((doc) => doc.data());

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json(`Error in alitursucularGithubRepos route: ${error.message}`);
    }
});

app.get("/alitursucularGithubRepoByName/:repoName?", async (req, res) => {
    const { repoName } = req.params;

    if (!repoName) {
        return res.status(400).json({ error: "Repo name is missing" });
    }

    try {
        let collectionRef = db.collection(ALITURSUCULAR_GITHUB_COLLECTION);
        let snapshot = await collectionRef.get();

        if (snapshot.empty) {
            await fetchRepos();
            collectionRef = db.collection(ALITURSUCULAR_GITHUB_COLLECTION);
        }

        const repoDoc = await collectionRef.doc(repoName).get();

        if (!repoDoc.exists) {
            res.status(404).json({ error: `Repo ${repoName} not found` });
        } else {
            const repoData = repoDoc.data();
            res.status(200).json(repoData);
        }
    } catch (error) {
        res.status(500).json(`Error getting repo ${repoName}: ${error}`);
    }
});

exports.app = functions.https.onRequest(app);

exports.fetchAlitursucularGithub = functions.pubsub.schedule("every 2 hours").onRun(async () => {
    await fetchRepos();
});
