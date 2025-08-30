AI Content Creator Platform – Agents.md Guide
Project Overview

This project is an AI-Powered Content Creator Platform built with Next.js and Firebase. It enables users to generate marketing content (text and simple designs) tailored to specific use-cases (e.g., Automotive, Retail, Restaurant) by leveraging OpenAI for text generation and provides an interactive visual editor for combining text with images. The platform streamlines content creation by asking users targeted questions, using AI to draft content, and allowing users to fine-tune the results with their own images and design elements.

Tech Stack and Tools

Frontend: Next.js (React) with TypeScript for building a responsive web UI.

Backend: Firebase services:

Authentication for user sign-up/login (email-password, with potential to add OAuth providers).

Cloud Firestore as the database to store user data (content templates, saved designs metadata, etc.).

Cloud Storage for storing user-uploaded images and possibly exported designs.

(Potentially Cloud Functions or Next.js API routes for secure server-side operations like calling third-party APIs).

AI Integration: OpenAI API (Chat Completion endpoint, e.g., GPT-4 model) for generating text content based on user inputs.

Image Processing: @imgly/background-removal library for client-side image background removal
npmjs.com
. This runs entirely in the browser (using WebAssembly) to remove image backgrounds without sending data to a server, preserving privacy and avoiding extra infrastructure costs.

Visual Editor Library: A JavaScript canvas library (such as Konva with React bindings or Fabric.js) for implementing the drag-and-drop image/text editor. Konva is a strong option as it supports high-performance canvas operations and offers a React integration (react-konva)
dev.to
. Fabric.js is also capable and has built-in manipulation handles; the choice can be finalized during implementation. The editor must support layering, transformations (move/resize/rotate), and exporting to an image.

Key Features and Functional Requirements

1. User Accounts & Data Security:

Users create accounts and log in via Firebase Auth. Each authenticated user has isolated storage for their content.

Firestore will have collections like users/{userId}/templates (for custom content question sets), users/{userId}/designs (for saved design projects), and perhaps users/{userId}/images or we use Storage only for images and store metadata (file URLs, categories) in Firestore.

Security rules: ensure users can only read/write their own documents and images. Utilize Firebase’s security rules to enforce this.

The app is designed to be multi-tenant. In the future, when introducing subscriptions, user documents may have a field like plan: free|premium to gate features (not enforced yet, but structure is ready).

2. Image Upload & Management:

Users can upload images (via file uploader in the UI). Uploaded images are stored in Firebase Storage, e.g., under paths like /images/{userId}/{category}/{filename}.

The UI will allow users to organize images into categories. We will provide default categories: Backgrounds, Logos/Branding, Marketing, Badges. These cater to typical assets a user might use in designs (e.g., backgrounds for canvas, logos or branding images, decorative badges or icons, etc.).

Users can create up to two custom categories of their own. This flexibility lets them tailor the library to their needs (for example, a user might add a category for “Product Photos” or “Team Photos”). The app should handle adding these custom categories (perhaps stored in Firestore as part of the user’s profile or a separate collection, listing the category names).

Images in each category can be listed in the UI (possibly with thumbnails). Basic image management like deletion or renaming might be included (nice-to-have).

Background Removal: After uploading an image, the user has an option to remove its background. Using the @imgly/background-removal library, we perform this in the browser. When invoked, the library processes the image data and returns a new image (PNG with transparent background)
npmjs.com
. We then show the result to the user, and if they accept it, we can save this new image to Storage (perhaps automatically replace the original or save alongside it, e.g., “imageName_bgremoved.png”). We should not charge extra server calls for this; it’s all client-side. The first use might be slow due to model loading, so inform the user (e.g., a loading spinner with message “Preparing background removal…”).

3. AI Text Content Generation (Use-Case Templates):

The core differentiator is guided content creation. The app offers templates for specific use cases/industries: currently Automotive, Retail, and Restaurant. Each template is essentially a small form or wizard that collects key information from the user, then produces a tailored piece of marketing text via AI.

Built-in Templates (Automotive, Retail, Restaurant): For each of these, define a set of questions. For example:

Automotive Template: Could ask for “Type of business or event” (e.g., car dealership sale, auto repair service, etc.), “Key offer or headline” (e.g., discount details), “Target audience” (e.g., luxury car buyers, budget-conscious drivers), “Tone of voice” (exciting, professional, trustworthy, etc.), and “Call to action”.

Retail Template: Ask for “Product or sale description”, “Store name or brand”, “Target customer segment”, “Key benefits or offers”, “Brand voice/tone”.

Restaurant Template: Ask for “Type of restaurant or cuisine”, “Signature dish or special offer”, “Dining experience or ambiance to highlight”, “Target audience” (families, foodies, etc.), and “Brand voice” (family-friendly, gourmet, fun, etc.).

These questions help gather the context and goals which will be fed into the OpenAI prompt. After the user fills the form, the app will construct a prompt along the lines of:
“You are a copywriting assistant specialized in [Industry]. Write a [content format, e.g., Facebook ad, Instagram post, flyer text] for a [Business Type] highlighting [Key Offer] to [Target Audience] in a [Tone] tone. The content should be engaging and include [any key points].”
The exact prompt will depend on the template and user inputs, but it should include: Goal/content type, Audience, Tone, Key message, and any specific instructions
contentgrip.com
contentgrip.com
 to steer the AI output.

Use OpenAI’s Chat Completion API (with a system message if needed to enforce role, and the user message containing the composed prompt). The model (GPT-4 for best results, or GPT-3.5 for cost saving) returns the content. We then display the generated text to the user.

The user can then choose to Accept the generated text (and proceed to use it in the visual editor) or regenerate if it’s not satisfactory (perhaps allow a couple of re-rolls). They can also edit the text manually after accepting.

Custom Templates: In addition to built-ins, users can create their own content-generation template (up to 2). A custom template might allow the user to specify a name for the template and a set of questions (or possibly choose from some generic questions). For MVP, if creating a custom template UI is complex, we might allow a “Custom Use Case 1” and “Custom Use Case 2” that simply use a generic prompt structure (like asking “Describe your business/offer”, “Who is your audience?”, “What tone or style?”, etc.). The user’s answers then feed into a general marketing copy prompt. We will store custom templates in Firestore under the user’s data, so they persist for that user.

4. Visual Editor (Design Canvas):

Once the text content is generated (or even if the user writes their own), the platform provides a visual editor to compose a graphic or layout. The editor is essentially a canvas where the user can lay out text and images together to create, say, a social media post, flyer, banner, etc.

Canvas and Layers: The editor canvas could be a fixed size (for example, letter size or a square Instagram post depending on template, maybe allow choices). On this canvas, users can insert:

Text boxes: initialized with the AI-generated text (split into headline and body if applicable) or blank for user to input. Text boxes should be draggable and the text editable.

Images: users can choose from their uploaded images to place on the canvas (e.g., a logo, a product photo, or a background image). We might allow setting one image as a background layer (stretched to canvas) and others as smaller overlay images.

Drag, Drop, Resize, Rotate: Users should be able to select any element (image or text box) on the canvas and then move it around freely (not confined to a grid or predefined positions). They should also be able to resize (scale) and rotate elements. For images, we maintain aspect ratio when scaling. For text, resizing could maybe just change font size (or the text box size with wrapping). A rotate handle or gesture should let them tilt images or text as needed.

Layer Ordering: The editor should manage z-index of elements. Users may send elements to front or back. This can be done via a simple “Bring to Front / Send to Back” button for each selected element, or a sidebar list of layers. Using a canvas library will help manage this (e.g., Konva’s Layer and zIndex methods
konvajs.org
 or Fabric’s sendToFront/sendToBack).

Editing Tools UI: We will implement a toolbar or context menu for common actions: delete element, duplicate element, layer order, font size/color picker for text, etc. Start with essentials (delete and layer order, font size) to keep it manageable.

Backgrounds: Users might want to use an image as the background of the canvas. We should allow setting a background layer easily (maybe by selecting an image and marking it “Set as background” which could resize it to fill the canvas). Alternatively, provide a canvas background color or image setting.

Manual Text Edits: The text content from AI is not locked – users can click into a text box and edit the copy to better suit their needs or tone. This encourages a human-in-the-loop approach where AI provides a draft and the user refines it.

Export Functionality: Provide a way to save the composed design. Using the canvas library’s export function, we can generate an image (PNG) of the final layout. The user can download this. We might also store it in Firebase Storage (especially if the user wants to reuse it later or for record). If storing, be mindful of storage costs (maybe only on user action).

Performance: Large images could slow down the canvas, so we might downscale images on canvas if they exceed certain resolution (most web graphics don’t need 8K images, for example). Also, ensure that the app remains responsive when manipulating elements (possibly use requestAnimationFrame for canvas re-renders if using pure canvas).

5. Saving Designs and Templates:

After creating a design in the editor, the user can save the project. This save should preserve: which template was used (if any), the content of each text box, and the positions/sizes of all elements, plus references to the images used. We can save this as a JSON structure in Firestore under users/{userId}/designs/{designId}. Example structure:

{
  "name": "Black Friday Car Sale Ad",
  "template": "Automotive",
  "elements": [
    { "type": "image", "imageUrl": ".../userId/Backgrounds/car.jpg", "x": 0, "y": 0, "width": 800, "height": 600, "rotation": 0, "layer": 0 },
    { "type": "text", "text": "Huge Black Friday Sale!", "x": 100, "y": 50, "fontSize": 32, "color": "#FF0000", "rotation": 0, "layer": 1 },
    { "type": "text", "text": "All models 20% off this weekend only.", "x": 100, "y": 100, "fontSize": 20, "color": "#000000", "rotation": 0, "layer": 2 },
    { "type": "image", "imageUrl": ".../userId/Logos/logo.png", "x": 600, "y": 20, "width": 150, "height": 150, "rotation": 0, "layer": 3 }
  ]
}


(This is a conceptual example to illustrate; actual implementation might differ.)

The user can later load this design (we provide a dashboard or list of saved designs) and it will reconstruct the canvas so they can continue editing or use it as a template for a new project.

The answers to the questionnaire for content generation could also be saved with the design or template, in case they want to tweak answers and regenerate text. However, storing just the final text might be sufficient, unless we want a “re-generate with different inputs” feature.

6. Future Subscription Model Consideration:

While the initial version is free for all users, we anticipate adding a subscription. Likely, we will integrate Stripe Payments using Firebase Extensions (e.g., “Run Subscription Payments with Stripe”)
firebase.google.com
. In preparation, our code should be organized to easily disable/enable certain features based on user plan. Examples of features to limit for free users: number of AI generations per day, number of projects saved, or access to certain premium templates or image assets.

Add placeholders in the UI for “Upgrade to Premium” (even if non-functional initially) and clearly separate what could be premium features in the future in the code (using flags or config).

Ensure that implementing the Stripe checkout and webhooks (likely via Cloud Functions) will be straightforward by following Firebase and Stripe best practices (for instance, using the Stripe customer ID attached to Firebase Auth UID, etc.). We won’t implement this now, but the code should not preclude adding it.

Development Guidelines and Implementation Notes

Project Structure: Use a clean Next.js project structure. With Next.js App Router, create an authenticated area for the app (maybe under /app/dashboard for logged-in users, etc.). Keep components modular: e.g., ImageLibrary component for image upload/list, BackgroundRemover component wrapping the imgly library call, ContentForm for the questionnaire, EditorCanvas for the visual editor. Use context or state management (React Context or lightweight Zustand, etc.) as needed to pass data (e.g., passing the generated text to the editor).

State Management: Given the app complexity, we might use local component state and React context for simpler parts. If state becomes complex (like managing a list of layers globally), consider a state library or Redux Toolkit for predictability. But try to start simple.

AI Prompt Engineering: Pay attention to how prompts are constructed. We can maintain a set of prompt templates (one for each domain, plus generic) perhaps stored in code or even in Firestore for easy updating. Ensure to include all relevant context in the prompt for best results (as noted earlier with goal, audience, etc.)
contentgrip.com
contentgrip.com
. We should also put a guardrail in the prompt asking the AI to keep content appropriate and not produce disallowed content (since user input is involved, but as a general safe practice).

Error Handling: Handle cases such as OpenAI API errors (network issues or content refusal), image upload failures, etc. Provide user feedback in those cases (e.g., “Content generation failed, please try again.”). Also, if the user input to AI is insufficient or too short, maybe catch that and prompt the user for more detail rather than sending a vague prompt.

Testing: Write basic tests for utility functions (if any) and perhaps integration tests for Firestore rules (security rules can be tested with the Firebase emulator suite). Also test the image processing in different browsers to ensure compatibility (the imgly library requires certain browser capabilities like WASM and possibly SharedArrayBuffer with proper headers; note Next.js on Vercel will need cross-origin isolation headers for SAB if we use that for performance
npmjs.com
).

Performance & Optimization: Use lazy loading for images (don’t load full image until needed in editor preview). Possibly generate thumbnails when images are uploaded (could be a future enhancement using a Firebase Cloud Function or client-side Canvas to resize the image for the library preview). For the OpenAI requests, ensure we’re not holding any unnecessary memory and consider streaming the response if using a compatible model (for faster partial display, though not required).

UI/UX: Keep the interface intuitive. Provide tooltips or labels on icon buttons in the editor. Ensure the form for content questions is clear and only appears when needed. Possibly implement a step-by-step wizard: Step 1 – Choose template, Step 2 – Answer questions, Step 3 – Review or regenerate text, Step 4 – Go to Editor, Step 5 – Edit & Export. This helps guide the user through the process.

Security: Never expose the OpenAI API key on the client – calls should go through a secure environment (server-side API route or Cloud Function). Use Firebase rules to secure data. Sanitize any user-provided text that might be displayed (to avoid XSS, though in our context most input goes to AI or is rendered in canvas, still be careful if using dangerouslySetInnerHTML anywhere – better to not use that).

Don’t: Do not run expensive operations on every load (for example, do not fetch all images from storage each time unnecessarily – list them as needed or cache metadata). Don’t call the OpenAI API without user action (to conserve quota). And do not run full test suites or install heavy dependencies unless necessary if using an AI coding agent, to keep iterations quick. Only run relevant tests (or use a selective approach) if asked to test the code (since we want to avoid lengthy operations unless explicitly needed).