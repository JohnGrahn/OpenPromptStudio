from pydantic import BaseModel, computed_field
import hashlib


class StackPack(BaseModel):
    title: str
    description: str
    from_registry: str
    sandbox_init_cmd: str
    sandbox_start_cmd: str
    prompt: str
    setup_time_seconds: int

    @computed_field
    def pack_hash(self) -> str:
        """Generate a unique hash for this pack based on init command and registry."""
        content = f"{self.sandbox_init_cmd}{self.from_registry}".encode()
        return hashlib.sha256(content).hexdigest()[:12]


_SETUP_COMMON_CMD = """
cd /app

if [ ! -d 'frontend' ]; then 
    cp -r /frontend .; 
fi

if [ -f /app/frontend/package.json ]; then
    cat /app/frontend/package.json
    ls -l /app/frontend
fi

git config --global user.email 'bot@openpromptstudio.com'
git config --global user.name 'Open Prompt Studio Bot'
git config --global init.defaultBranch main
if [ ! -d ".git" ]; then
    git init
    git config --global init.defaultBranch main
    git add -A
    git commit -m 'Initial commit'
fi

cat > .gitignore << 'EOF'
node_modules/
.config/
.env
.next/
.cache/
.netlify/
*.log
dist/
build/
tmp/
EOF

if [ ! -f '/app/.env' ]; then
    touch /app/.env
fi
if ! grep -q "^IS_PROMPT_STUDIO=" /app/.env; then
    echo "IS_PROMPT_STUDIO=true\n" >> /app/.env
fi
set -a
[ -f /app/.env ] && . /app/.env
set +a
""".strip()

_START_REACT_CMD = f"""
{_SETUP_COMMON_CMD}
cd /app/frontend
bun run dev
""".strip()

_START_VUE_CMD = f"""
{_SETUP_COMMON_CMD}
cd /app/frontend
bun run dev
""".strip()


# TODO: Replace these registry paths with actual ones after building and publishing the images
PACKS = [
    StackPack(
        title="React",
        description="A simple React App with TypeScript and Vite. Best for starting from scratch with minimal components.",
        from_registry="ghcr.io/johngrahn/openpromptstudio/react-vanilla:latest",
        sandbox_init_cmd=_SETUP_COMMON_CMD,
        sandbox_start_cmd=_START_REACT_CMD,
        prompt="""
You are building a React app with TypeScript.

The user chose to use a "vanilla" app so avoid adding any additional dependencies unless they are explicitly asked for.

Already included:
- React v18 (app created with Vite)
- TypeScript
- Tailwind CSS
- `bun install` already run for these
- /app/.env, /app/.git

Style Tips:
- Use inline tailwind classes over custom css
- Use tailwind colors over custom colors
- Assume the user wants a nice looking UI out of the box (so add styles as you create components and assume layouts based on what the user is building)

Structure Tips:
- Use /src/pages for page components
- Use /src/components for reusable components
- Use /src/layouts for layout components
- Use /src/types for TypeScript interfaces and types

Code Tips:
- Use functional components with hooks
- Use TypeScript types for all props and state
- Use proper type annotations for functions and variables

3rd Party Tips:
- If you need to build a map, use react-leaflet
    1. $ bun add react-leaflet leaflet @types/leaflet
    2. `import { MapContainer, TileLayer, useMap } from 'react-leaflet'` (you do not need css imports)
- If you need placeholder images, use https://openpromptstudio.com/api/mocks/images[?orientation=landscape&query=topic] (this will redirect to a random image)
""".strip(),
        setup_time_seconds=60,
    ),
    StackPack(
        title="React Shadcn",
        description="A React app with Shadcn UI and TypeScript. Best for building a modern web app with a modern UI.",
        from_registry="ghcr.io/johngrahn/openpromptstudio/react-shadcn:latest",
        sandbox_init_cmd=_SETUP_COMMON_CMD,
        sandbox_start_cmd=_START_REACT_CMD,
        prompt="""
You are building a React app with Shadcn UI and TypeScript.

The user chose to use a React app with Shadcn UI so avoid adding any additional dependencies unless they are explicitly asked for.

Already included:
- React v18 (app created with Vite)
- TypeScript
- Tailwind CSS
- lucide-react
- axios
- recharts
- All shadcn components are already installed (import them like `@/components/ui/button`)
- `bun install` already run for these
- /app/.env, /app/.git

Style Tips:
- Use inline tailwind classes over custom css
- Use tailwind colors over custom colors
- Prefer shadcn components as much as possible over custom components
- Assume the user wants a nice looking UI out of the box (so add styles as you create components and assume layouts based on what the user is building)

Structure Tips:
- Use /src/pages for page components
- Use /src/components for reusable components
- Use /src/layouts for layout components
- Use /src/types for TypeScript interfaces and types

Code Tips:
- Use functional components with hooks
- Use TypeScript types for all props and state
- Use proper type annotations for functions and variables

3rd Party Tips:
- If you need to build a map, use react-leaflet
    1. $ bun add react-leaflet leaflet @types/leaflet
    2. `import { MapContainer, TileLayer, useMap } from 'react-leaflet'` (you do not need css imports)
- If you need placeholder images, use https://openpromptstudio.com/api/mocks/images[?orientation=landscape&query=topic] (this will redirect to a random image)
""".strip(),
        setup_time_seconds=60,
    ),
    StackPack(
        title="React Pixi",
        description="A React app with Pixi.js and TypeScript. Best for games, animations, and interactive graphics.",
        from_registry="ghcr.io/johngrahn/openpromptstudio/react-pixi:latest",
        sandbox_init_cmd=_SETUP_COMMON_CMD,
        sandbox_start_cmd=_START_REACT_CMD,
        prompt="""
You are building a React app with Pixi.js and TypeScript.

The user chose to use a React app with Pixi.js so avoid adding any additional dependencies unless they are explicitly asked for.

Already included:
- React v18 (app created with Vite)
- TypeScript
- Tailwind CSS
- Pixi.js v8.6.6 with TypeScript types
- @pixi/mesh-extras
- `bun install` already run for these
- /app/.env, /app/.git

Style Tips:
- Keep your code clean and readable
- Use TypeScript types for all variables and functions
- Use proper Pixi.js best practices

Structure Tips:
- Use /src/pixi for Pixi.js related code
- Use /src/components for React components
- Use /src/types for TypeScript interfaces and types
- Keep Pixi.js logic separate from React components

Code Tips:
- Use the PixiApp class for Pixi.js setup and game logic
- Use React hooks to manage Pixi.js lifecycle
- Use TypeScript types for all game state and entities
- Clean up Pixi.js resources when components unmount

Example Structure:
```typescript
// /src/pixi/app.ts
export class PixiApp {
  private app: Application;
  // ... other properties

  constructor() {
    this.app = new Application();
  }

  async init(): Promise<void> {
    await this.app.init({ 
      resizeTo: window,
      backgroundColor: 0x000000 
    });
    // ... setup code
  }

  cleanup(): void {
    this.app.destroy();
  }
}

// /src/App.tsx
export default function App() {
  const pixiAppRef = useRef<PixiApp | null>(null);

  useEffect(() => {
    const app = new PixiApp();
    app.init();
    pixiAppRef.current = app;

    return () => {
      pixiAppRef.current?.cleanup();
    };
  }, []);

  return <main className="w-screen h-screen bg-black" />;
}
```
""".strip(),
        setup_time_seconds=60,
    ),
    StackPack(
        title="Vue",
        description="A Vue 3 app with TypeScript and Vite. Best for starting from scratch with minimal components.",
        from_registry="ghcr.io/johngrahn/openpromptstudio/vue-vanilla:latest",
        sandbox_init_cmd=_SETUP_COMMON_CMD,
        sandbox_start_cmd=_START_VUE_CMD,
        prompt="""
You are building a Vue 3 app with TypeScript.

The user chose to use a "vanilla" app so avoid adding any additional dependencies unless they are explicitly asked for.

Already included:
- Vue 3 (app created with create-vue)
- TypeScript
- Vue Router
- Tailwind CSS
- ESLint + Prettier
- `bun install` already run for these
- /app/.env, /app/.git

Style Tips:
- Use inline tailwind classes over custom css
- Use tailwind colors over custom colors
- Assume the user wants a nice looking UI out of the box
- Use Vue's Composition API and <script setup> syntax

Structure Tips:
- Use /src/views for page components
- Use /src/components for reusable components
- Use /src/composables for shared logic
- Use /src/types for TypeScript interfaces and types

Code Tips:
- Use TypeScript types for all props and refs
- Use proper type annotations for functions and variables
- Use Vue's built-in type utilities (PropType, etc.)
- Follow Vue 3's Composition API best practices

Example Component:
```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { PropType } from 'vue'

interface Item {
  id: number
  name: string
}

const props = defineProps({
  items: {
    type: Array as PropType<Item[]>,
    required: true
  }
})

const count = ref<number>(0)

const increment = (): void => {
  count.value++
}
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold">{{ count }}</h1>
    <button @click="increment" class="px-4 py-2 bg-blue-500 text-white rounded">
      Increment
    </button>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>
```

3rd Party Tips:
- If you need placeholder images, use https://openpromptstudio.com/api/mocks/images[?orientation=landscape&query=topic] (this will redirect to a random image)
""".strip(),
        setup_time_seconds=60,
    ),
]