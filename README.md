# Dragon Knight - Three.js Project

A 3D scene featuring a dragon, knight, and temple built with Three.js.

## Deployment on Render

### Option 1: Manual Deployment (Easiest)

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Use the following settings:
   - **Build Command**: `node custom-build.js`
   - **Publish Directory**: `dist`

That's it! Your site will be deployed automatically.

### Option 2: Blueprint Deployment (Advanced)

1. Make sure the `render.yaml` file is in your repository
2. Go to Render dashboard and click "New Blueprint"
3. Connect your repository
4. Render will automatically detect the render.yaml file and configure your service

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```

## Building for Production

To build the project locally:

```
node custom-build.js
```

This will create a `dist` folder with the optimized files for production.

## Project Structure

- `assets/` - 3D models and other assets
- `shader/` - Custom shaders
- `main.js` - Main application code
- `custom-build.js` - Build script for production 