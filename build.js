const fs = require('fs');
const path = require('path');

['dist', 'public'].forEach(outDirName => {
  const outDir = path.join(__dirname, outDirName);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }

  const files = ['index.html', 'profile.html', 'survey.html', 'approach.html', 'how-to-use.html', 'rebuilding-life-challenges.html', 'employment-challenges.html', 'style.css', 'script.js', 'hope-survey.html', 'minds-eye-white-bg.mp4', 'minds-eye.png', 'minds-eye-animated.mp4', 'minds-eye-animated.webm'];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(outDir, file));
    }
  });

  const assetsDirSrc = path.join(__dirname, 'assets');
  const assetsDirDest = path.join(outDir, 'assets');
  if (fs.existsSync(assetsDirSrc)) {
    if (!fs.existsSync(assetsDirDest)) {
      fs.mkdirSync(assetsDirDest);
    }
    fs.readdirSync(assetsDirSrc).forEach(file => {
      fs.copyFileSync(path.join(assetsDirSrc, file), path.join(assetsDirDest, file));
    });
  }

  const key = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY || "";
  const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

  ['profile.html', 'survey.html', 'hope-survey.html'].forEach(file => {
    const filePath = path.join(outDir, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/%VITE_ELEVENLABS_API_KEY%/g, key);
      content = content.replace(/%VITE_GEMINI_API_KEY%/g, geminiKey);
      fs.writeFileSync(filePath, content);
    }
  });
});

console.log("Build complete. Output generated in both dist/ and public/ to guarantee Vercel compatibility.");