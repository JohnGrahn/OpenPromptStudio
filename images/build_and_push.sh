#!/bin/bash

# Set your GitHub username and repository
GITHUB_USERNAME="johngrahn"
REPO_NAME="openpromptstudio"

# Clean up any existing temporary files
echo "Cleaning up temporary files..."
rm -f [0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]*

# Build images
echo "Building React Vanilla image..."
podman build -f ReactVanillaDockerFile -t ghcr.io/$GITHUB_USERNAME/$REPO_NAME/react-vanilla:latest .

echo "Building React Shadcn image..."
podman build -f ReactShadcnDockerFile -t ghcr.io/$GITHUB_USERNAME/$REPO_NAME/react-shadcn:latest .

echo "Building React Pixi image..."
podman build -f ReactPixiDockerFile -t ghcr.io/$GITHUB_USERNAME/$REPO_NAME/react-pixi:latest .

echo "Building Vue Vanilla image..."
podman build -f VueVanillaDockerFile -t ghcr.io/$GITHUB_USERNAME/$REPO_NAME/vue-vanilla:latest .

# Clean up temporary files again
echo "Cleaning up temporary files..."
rm -f [0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]*

# Login to GitHub Container Registry
echo "Logging in to GitHub Container Registry..."
echo "Please enter your GitHub Personal Access Token:"
read -s GITHUB_TOKEN
echo $GITHUB_TOKEN | podman login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Push images
echo "Pushing images to GitHub Container Registry..."
podman push ghcr.io/$GITHUB_USERNAME/$REPO_NAME/react-vanilla:latest
podman push ghcr.io/$GITHUB_USERNAME/$REPO_NAME/react-shadcn:latest
podman push ghcr.io/$GITHUB_USERNAME/$REPO_NAME/react-pixi:latest
podman push ghcr.io/$GITHUB_USERNAME/$REPO_NAME/vue-vanilla:latest

# Final cleanup
echo "Final cleanup..."
rm -f [0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]*

echo "Done!" 