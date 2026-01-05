export interface PromptPart {
  text: string;
  annotation?: string;
}

export interface ToolPrompt {
  parts: PromptPart[];
  description: string;
}

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: string;
  goals: string[];
  tips: string[];
  prompts: ToolPrompt[];
  workflows: string[];
  integrations: string[];
}

export const toolsData: Tool[] = [
  {
    slug: "vibecode",
    name: "Vibecode",
    description: "AI-powered code generation and optimization. Build apps with high-level 'Vibe' guidance.",
    category: "Coding",
    goals: ["Full-stack Apps", "Rapid Prototyping", "Technical Design"],
    tips: [
      "Use 'Vibe PMing': Ask the AI to write a detailed README and tech stack before generating any code.",
      "Work in modular loops: Describe -> Generate -> Execute -> Refine.",
      "Manage Context: Periodically ask the AI to summarize the codebase."
    ],
    prompts: [
      {
        parts: [{ text: "Write a README.md for a [Project Name] including file structure, tech stack, and phase 1 milestones." }],
        description: "Standard 'Vibe PM' prompt to establish ground truth before coding."
      },
      {
        parts: [{ text: "Refactor this component into smaller, modular files following Domain-Driven Design." }],
        description: "Use this to clean up 'God Components' and improve maintainability."
      }
    ],
    workflows: [
      "Vibe PM: README -> Technical Design -> Scaffolding.",
      "Iteration: Prompt -> Review Code -> Browser Verify -> Fix Prompt."
    ],
    integrations: ["Cursor", "GitHub", "Vercel", "Claude"]
  },
  {
    slug: "kling",
    name: "Kling",
    description: "Next-gen AI video generation. Master cinematic physics and character consistency.",
    category: "Video",
    goals: ["Viral Content", "Film Production", "Social Media Ads"],
    tips: [
      "Apply the 'FORMS' formula: Focus, Outcome, Realism, Motion, Setting.",
      "Use 'Motion Brush' for fine-grained control over specific parts of the frame.",
      "Chain generations by using the 'End Frame' of one clip as the starting point of the next."
    ],
    prompts: [
      {
        parts: [
          { text: "Cinematic tracking shot, [Subject], " },
          { text: "slow dolly zoom", annotation: "Complex camera motion that shifts perspective dramatically." },
          { text: ", 4k, cinematic lighting, style of [Director]." }
        ],
        description: "Establishes pro-camera movement and high-fidelity lighting."
      }
    ],
    workflows: [
      "Storyboarding: Midjourney Keyframes -> Kling Animation.",
      "Long-form: Clip 1 (End Frame) -> Clip 2 (Matching Start) -> Adobe Premiere."
    ],
    integrations: ["Midjourney", "Luma Dream Machine", "ElevenLabs"]
  },
  {
    slug: "midjourney",
    name: "Midjourney",
    description: "High-fidelity AI image generation. The gold standard for artistic control.",
    category: "Image",
    goals: ["Brand Identity", "Concept Art", "consistent Characters"],
    tips: [
      "Use '--sref' (Style Reference) with weight codes (e.g., ::2) to blend multiple aesthetics.",
      "Apply '--style raw' to achieve pure photorealism and avoid 'AI flair'.",
      "Use '--cref' with a URL to maintain a character's face across scenes."
    ],
    prompts: [
      {
        parts: [
          { text: "A futuristic laboratory, neon violet and cyan lighting, hyper-realistic " },
          { text: "--ar 16:9", annotation: "Cinematic aspect ratio standard." },
          { text: " " },
          { text: "--style raw", annotation: "Disables MJ's default artistic bias for pure photorealism." },
          { text: " " },
          { text: "--v 6.1", annotation: "The latest high-fidelity model." }
        ],
        description: "--style raw ensures no artistic bias; --v 6.1 is the latest realism model."
      },
      {
        parts: [
          { text: "Editorial fashion photography " },
          { text: "--sref [URL]", annotation: "Style reference URL." },
          { text: " " },
          { text: "--sw 100", annotation: "Style weight: 100 is maximal adherence." }
        ],
        description: "--sw 100 ensures the style reference is applied at maximum strength."
      }
    ],
    workflows: [
      "Concept Art: Prompting -> --sref (Style) -> --cref (Character).",
      "Asset Pipeline: Midjourney Image -> Magnific Upscale -> Game Engine."
    ],
    integrations: ["Kling", "Photoshop", "Magnific AI"]
  },
  {
    slug: "cursor",
    name: "Cursor",
    description: "The AI-native code editor. Build software at lightspeed with deep codebase indexing.",
    category: "Coding",
    goals: ["Product Engineering", "Bug Squashing", "Legacy Migration"],
    tips: [
      "Use '@Codebase' to allow the AI to search your entire project for context.",
      "Configure '.cursorrules' to enforce project-specific coding standards.",
      "Use 'Composer' (Cmd+I) to generate and apply changes across multiple files."
    ],
    prompts: [
      {
        parts: [
          { text: "Refactor our entire auth flow to use JWT instead of sessions according to " },
          { text: "@Codebase", annotation: "Forces the AI to scan all files for architectural patterns." },
          { text: " standards." }
        ],
        description: "@Codebase ensures the AI respects existing architecture."
      }
    ],
    workflows: [
      "Feature Build: Cmd+I (Composer) -> Describe Feature -> Review Diff -> Apply.",
      "Bug Fix: Highlight Code -> Cmd+L -> 'Fix this' -> Verify in Console."
    ],
    integrations: ["Vibecode", "GitHub", "Vercel", "Claude"]
  },
  {
    slug: "luma-dream-machine",
    name: "Luma Dream Machine",
    description: "Cinematic AI video generator. Best for physics-accurate motion and looping.",
    category: "Video",
    goals: ["Cinematography", "Looping Textures", "CGI Visuals"],
    tips: [
      "Master Keyframing: Upload a start and end image to dictate exactly how a scene transitions.",
      "Use 'Looping' prompts to create seamless 360-degree environments.",
      "Maintain context: Keep generations within a single 'Board'."
    ],
    prompts: [
      {
        parts: [
          { text: "A vibrant watercolor painting of a Parisian street in the rain, slow pan to the right, " },
          { text: "looping", annotation: "Critical for infinite backgrounds and textures." },
          { text: "." }
        ],
        description: "The 'looping' keyword triggers seamless animation for backgrounds."
      }
    ],
    workflows: [
      "Interpolation: Upload Start Image -> Upload End Image -> Animate.",
      "3D Workflow: Midjourney Texture -> Luma Loop -> Splash Screen Video."
    ],
    integrations: ["Midjourney", "Splination", "Blender"]
  },
  {
    slug: "flux-1",
    name: "Flux.1",
    description: "Prophetic image generation with perfect text rendering and complex scene logic.",
    category: "Image",
    goals: ["Poster Design", "Interface Mockups", "Street Photography"],
    tips: [
      "Describe text explicitly: Flux handles kerning and fonts perfectly.",
      "Use layered descriptions: Break prompts into foreground, middle, and background.",
      "Avoid syntax for other models: Flux prefers natural language instructions."
    ],
    prompts: [
      {
        parts: [
          { text: "A neon sign on a rainy street that says " },
          { text: "'VIBE LAB'", annotation: "Flux can render this text perfectly every time." },
          { text: " in a stylistic cyberpunk font, 8k." }
        ],
        description: "Demonstrates Flux's superior text accuracy compared to other models."
      }
    ],
    workflows: [
      "Typography: Prompt Text -> Specify Font -> Define Background Layer.",
      "UI Elements: Flux Prompt for Icons -> Remove Background -> Sprite Sheet."
    ],
    integrations: ["ComfyUI", "Stable Diffusion", "Photoshop"]
  },
  {
    slug: "meshy",
    name: "Meshy",
    description: "Text and image to high-fidelity 3D. The fastest way to generate production-ready assets.",
    category: "3D",
    goals: ["Game Development", "Product Visualization", "3D Printing"],
    tips: [
      "Optimize textures: Use 'High Richness' for realistic models.",
      "Use 'AI Healing': Select facial cracks directly on the 3D model to re-render them.",
      "Style Transfer: Upload an existing asset to match its modeling style."
    ],
    prompts: [
      {
        parts: [
          { text: "Highly detailed sci-fi helmet, matte black with glowing blue runes, " },
          { text: "intricate filigree", annotation: "Forces higher polygon detail on the mesh surface." },
          { text: "." }
        ],
        description: "Focuses on surface detail and lighting for 3D PBR materials."
      },
      {
        parts: [
          { text: "Game-ready " },
          { text: "low-poly", annotation: "Essential for Unity/Unreal performance." },
          { text: " pine tree with snowy textures." }
        ],
        description: "Optimized for engine performance with the 'low-poly' keyword."
      }
    ],
    workflows: [
      "Game Asset: Meshy Model -> Texture Healing -> FBX Export -> Unity.",
      "Avatar: Midjourney Portrait -> Meshy Image-to-3D -> VRChat."
    ],
    integrations: ["Blender", "Unity", "Unreal Engine", "Spline"]
  },
  {
    slug: "skybox-ai",
    name: "Skybox AI",
    description: "Immersive 360° environment generation. Create entire worlds in seconds.",
    category: "3D Worlds",
    goals: ["VR Experiences", "Level Design", "Metaverse Building"],
    tips: [
      "Use 'Advanced (No Style)' for long, complex prompts.",
      "Download Depth Maps for Unity/Unreal to add 3D geometry to your skybox.",
      "Remix for Lighting: Use 'Remix' mode to keep structure but change mood."
    ],
    prompts: [
      {
        parts: [
          { text: "A panoramic view of a floating steampunk city above a sea of clouds, " },
          { text: "golden hour", annotation: "Defines the lighting and shadow physics for the entire 360 world." },
          { text: "." }
        ],
        description: "360-degree panorama optimized for VR headsets."
      }
    ],
    workflows: [
      "Level Design: Sketch Horizon -> Generate 360 -> Export Depth Map -> Unity Mesh.",
      "Atmosphere: Realistic Preset -> Remix Mode (Lighting) -> HDR Export."
    ],
    integrations: ["Unity", "Unreal Engine", "Quest 3", "VRChat"]
  },
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    description: "The peak of AI audio. Emotional voice cloning and precise speech manipulation.",
    category: "Audio",
    goals: ["Podcasting", "Video Narration", "Game Dialogue"],
    tips: [
      "Use '[Audio Tags]': Wrap performance cues like '[happy]' or '[whispers]'.",
      "Stability vs. Clarity: Lower stability for more emotional variation.",
      "Speech-to-Speech: Record yourself to preserve the exact cadence."
    ],
    prompts: [
      {
        parts: [
          { text: "Narrate this script: [Script] " },
          { text: "[whispers]", annotation: "Performance tag that changes the AI's vocal intensity." },
          { text: " 'The secret lies within the latent space.'" }
        ],
        description: "Demonstrates audio tags for performance directing."
      }
    ],
    workflows: [
      "Cadence Fix: Text-to-Speech -> Record Self (STS) -> Final Performance.",
      "Narrative: Claude Script -> ElevenLabs Emotional Voice -> Video Overlay."
    ],
    integrations: ["Claude", "Kling", "Adobe Premiere", "DaVinci Resolve"]
  }
];

export interface SpawnerStack {
  id: string;
  name: string;
  intentKeywords: string[];
  toolSlugs: string[];
  description: string;
}

export const spawnerStacks: SpawnerStack[] = [
  {
    id: "cinematic-video",
    name: "Cinematic Film Stack",
    intentKeywords: ["video", "film", "movie", "cinematic", "story", "trailer"],
    toolSlugs: ["midjourney", "kling", "elevenlabs"],
    description: "Visuals from Midjourney, Motion from Kling, and Emotional Narration from ElevenLabs."
  },
  {
    id: "rapid-web-proto",
    name: "Full-Stack Rapid Prototype",
    intentKeywords: ["web", "app", "react", "nextjs", "frontend", "mvp"],
    toolSlugs: ["vibecode", "cursor", "flux-1"],
    description: "Architect with Vibecode, Engineer with Cursor, and Design UI with Flux."
  },
  {
    id: "game-asset-pipeline",
    name: "3D Game Asset Pipeline",
    intentKeywords: ["game", "asset", "3d", "character", "modeling", "unity"],
    toolSlugs: ["midjourney", "meshy", "skybox-ai"],
    description: "Concept in MJ, Model in Meshy, and Build the World in Skybox AI."
  },
  {
    id: "viral-marketing",
    name: "Viral Ad Marketing Stack",
    intentKeywords: ["marketing", "ad", "viral", "social", "short", "content"],
    toolSlugs: ["flux-1", "luma-dream-machine", "elevenlabs"],
    description: "Perfect Typography from Flux, Dynamic Motion from Luma, and Catchy Audio from ElevenLabs."
  }
];

export const resolveIntent = (intent: string): SpawnerStack | null => {
  const lowerIntent = intent.toLowerCase();
  return spawnerStacks.find(stack =>
    stack.intentKeywords.some(keyword => lowerIntent.includes(keyword)) ||
    stack.name.toLowerCase().includes(lowerIntent)
  ) || null;
};
