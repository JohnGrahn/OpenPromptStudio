#!/bin/bash

# Set your GitHub username
GITHUB_USERNAME="JohnGrahn"

# Build images
echo "Building React Vanilla image..."
podman build -f ReactVanillaDockerFile -t ghcr.io/$GITHUB_USERNAME/react-vanilla:latest .

echo "Building React Shadcn image..."
podman build -f ReactShadcnDockerFile -t ghcr.io/$GITHUB_USERNAME/react-shadcn:latest .

echo "Building React Pixi image..."
podman build -f ReactPixiDockerFile -t ghcr.io/$GITHUB_USERNAME/react-pixi:latest .

echo "Building Vue Vanilla image..."
podman build -f VueVanillaDockerFile -t ghcr.io/$GITHUB_USERNAME/vue-vanilla:latest .

# Login to GitHub Container Registry
echo "Logging in to GitHub Container Registry..."
echo "Please enter your GitHub Personal Access Token:"
read -s GITHUB_TOKEN
echo $GITHUB_TOKEN | podman login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Push images
echo "Pushing images to GitHub Container Registry..."
podman push ghcr.io/$GITHUB_USERNAME/react-vanilla:latest
podman push ghcr.io/$GITHUB_USERNAME/react-shadcn:latest
podman push ghcr.io/$GITHUB_USERNAME/react-pixi:latest
podman push ghcr.io/$GITHUB_USERNAME/vue-vanilla:latest

echo "Done!" 