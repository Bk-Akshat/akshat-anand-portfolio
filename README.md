# Akshat Anand - Portfolio

A personal portfolio website highlighting Akshat Anand's work in data analytics, business intelligence, and software development.

## Features

- Responsive single-page layout with About, Skills, Projects, Experience, and Contact sections
- Dark and light theme toggle
- Interactive 3D background and motion effects
- Clickable certificate gallery with full-size certificates
- Resume download

## Run locally

This is a static website. Open `index.html` in a browser, or serve this folder with any static HTTP server.

## Deploy with GitHub Pages

GitHub Pages is configured to deploy automatically from the `main` branch using the workflow in `.github/workflows/deploy.yml`.

The site will be available at `https://<your-github-username>.github.io/<repository-name>/` after GitHub Pages finishes deploying.

## Deploy with Render

The root-level `render.yaml` defines this project as a static site and deploys the repository root from `main`.

1. Sign in to the [Render Dashboard](https://dashboard.render.com/).
2. Select **New > Blueprint** and connect the `Bk-Akshat/akshat-anand-portfolio` GitHub repository if prompted.
3. Review the `akshat-anand-portfolio` static site and apply the Blueprint.

Render deploys future commits to `main` automatically. If this repository is already connected to a Render static site, pushes to `main` should trigger its automatic deploy without creating another service.

## Assets and dependencies

- [Three.js](https://threejs.org/) for the 3D background, loaded from cdnjs
- [Lucide](https://lucide.dev/) icons, loaded from unpkg
- DM Sans and Space Grotesk fonts, loaded from Google Fonts
- `Akshat_Anand_Resume.pdf`, linked by the site as a downloadable resume
- Certificate images in `Certificate/`, displayed as previews that open full-size in a new tab
