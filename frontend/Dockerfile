FROM oven/bun:1

WORKDIR /app

# Create node_modules directory and set permissions
RUN mkdir -p /app/node_modules && chown -R 1000:1000 /app

# Switch to non-root user
USER 1000:1000

# Copy package files first
COPY --chown=1000:1000 package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the application
COPY --chown=1000:1000 . .

# Build TypeScript configuration
RUN bunx tsc --noEmit

# Expose the port the app runs on
EXPOSE 5173

# Start the application with explicit host binding
CMD ["bun", "run", "--bun", "vite", "--host", "0.0.0.0"] 