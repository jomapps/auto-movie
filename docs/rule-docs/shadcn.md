# UI Components

## Overview
We are using tailwind css and shadcn/ui for our UI components.
KokonutUI is our custom component library built on top of shadcn/ui.

Please refer to context7 mcp for correct installation patterns.


Title: KokonutUI

URL Source: https://kokonutui.com/docs

Markdown Content:
Installation
------------

Getting started with KokonutUI

### [1. Add namespaces with components.json](https://kokonutui.com/docs#1-add-namespaces-with-componentsjson)

The components.json file holds configuration for your project, and allow easy installation of any components.

### Note: The `components.json` file is optional

It is only required if you're using the CLI to add components to your project. If you're using the copy and paste method, you don't need this file.

You can create a components.json file in your project by running the following command:

Then, you'll need to add this to your `components.json` to allow kokonutUI registry.

```
{
    "registries": {
        "@kokonutui": "https://kokonutui.com/r/{name}.json"
    }
}
```

### [2. Install utilities](https://kokonutui.com/docs#2-install-utilities)

All components use [Tailwind CSS v4](https://tailwindcss.com/docs/installation/framework-guides/nextjs), so ensure it's installed in your project. Many components also use the `cn` utility function—install it with the following command:

### [3. That's it 🎉](https://kokonutui.com/docs#3-thats-it-)

We use [lucide-icons](https://lucide.dev/guide/installation) for most components that include icons, along with some [shadcn/ui](https://ui.shadcn.com/) components. These dependencies will be automatically installed when using the CLI.

For exemple to add `particle-button` component to your project, it will be easy as:

_While we provide a convenient 'copy' button for the code, we strongly recommend using the CLI for installing components, as it ensures all necessary files are included._

Add to your page and it works!

```
import ParticleButton from "@/components/kokonutui/particle-button";

export default function Page() {
    return <ParticleButton />;
}
```

### [4. Optionnal dependencies](https://kokonutui.com/docs#4-optionnal-dependencies)

Some components require additional libraries, listed at the bottom of each components. Make sure to install them to ensure the component works properly.

### [5. Monorepo](https://kokonutui.com/docs#5-monorepo)

For monorepo `shadcn/ui` CLI contain the options `-c` to the path to your workspace for exemple:
Highlight connections
1 connections found
Actions
