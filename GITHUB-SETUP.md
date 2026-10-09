# Upload PromiseLens to Adeboy29's GitHub

1. Create a public repository named promiselens at https://github.com/new. Do not add a starter README.
2. Extract PromiseLens-source.zip. Upload the contents of PromiseLens-GitHub, rather than the enclosing folder, to the repository root. Include .github and .gitignore (Windows may hide them).
3. Confirm the repository root contains README.md, package.json, src, contracts, dist, and .github/workflows/pages.yml. Commit the files to main.
4. Open Settings > Pages. Under Build and deployment, set Source to GitHub Actions.
5. Open Actions > Publish PromiseLens > Run workflow > main > Run workflow. Wait for the deployment job to finish successfully.
6. Your expected website URL is https://adeboy29.github.io/promiselens/ . It is not live until the workflow succeeds.

Alternative using Git from this extracted folder:

    git init -b main
    git add .
    git commit -m "Publish PromiseLens source and Pages workflow"
    git remote add origin https://github.com/Adeboy29/promiselens.git
    git push -u origin main

Authenticate through GitHub's normal sign-in prompt. Do not put a token or wallet key in the repository.

The package includes the latest wallet connection fix and live Studionet verification records. GitHub Pages changes the frontend hosting address; the deployed GenLayer contract remains on Studionet. Promise discovery remains browser-local, and users on this new origin start with a separate browser-local index. Private keys are never included.
