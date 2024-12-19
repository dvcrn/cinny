# David's Cinny

This is a fork of [Cinny](https://github.com/cinnyapp/cinny) that changes the core behavior of how rooms are sorted, to work nicer with a setup that uses a lot of bridges and remote networks

It

- Includes all rooms across all spaces in "Home"
- Changes the default sorting across all spaces and "Home" to be by most recent activity 
    - Closing a section will still show the unread-only messages, sorted by most recent activity


## Install

Download from the latest release here: https://github.com/dvcrn/cinny/releases/latest


## Local development (from upstream)

> We recommend using a version manager as versions change very quickly. You will likely need to switch 
between multiple Node.js versions based on the needs of different projects you're working on. [NVM on windows](https://github.com/coreybutler/nvm-windows#installation--upgrades) on Windows and [nvm](https://github.com/nvm-sh/nvm) on Linux/macOS are pretty good choices. Recommended nodejs version is Iron LTS (v20).

Execute the following commands to start a development server:
```sh
npm ci # Installs all dependencies
npm start # Serve a development version
```

To build the app:
```sh
npm run build # Compiles the app into the dist/ directory
```

### Running with Docker
This repository includes a Dockerfile, which builds the application from source and serves it with Nginx on port 80. To
use this locally, you can build the container like so:
```
docker build -t cinny:latest .
```

You can then run the container you've built with a command similar to this:
```
docker run -p 8080:80 cinny:latest
```

This will forward your `localhost` port 8080 to the container's port 80. You can visit the app in your browser by navigating to `http://localhost:8080`.
