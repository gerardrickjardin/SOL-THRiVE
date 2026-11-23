const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const shortFileHash = (filePath) => {
  if (!fs.existsSync(filePath)) return '1';
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').slice(0, 8);
};

const cssHash = shortFileHash(path.join(__dirname, 'style.css'));
const jsHash = shortFileHash(path.join(__dirname, 'script.js'));
const shieldJsHash = shortFileHash(path.join(__dirname, 'bot-shield.js'));

// Archival design files kept in the repo but never referenced by any page.
// They are skipped during the build (and any stale copies are removed from the output).
const EXCLUDED_ROOT_FILES = new Set(['minds-eye-white-bg.mp4']);
const EXCLUDED_ASSETS = new Set([
  '.DS_Store',
  'Hero Page.png',
  'Hero Page (1).png',
  'Hero Page Drawing.png',
  'SOL THRiVE Hero Page Background.png',
  'hero-uphill-strides.png',
  'New Hero Page Background V2.png',
  'New Hero Page Background.png',
  'hero page minus header.jpg',
  'THRiVECoaching Hero img.jpeg',
  'hope_index_visual.png',
  'map_mockup.png',
  'sol-meadow-bg.jpg',
  'avatar-placeholder.png',
  'three-archetypes.jpg',
  'Slide1.PNG', 'Slide2.PNG', 'Slide3.PNG', 'Slide4.PNG', 'Slide5.PNG',
  'Slide6.PNG', 'Slide7.PNG', 'Slide8.PNG', 'Slide9.PNG'
]);

const removeIfExists = (filePath) => {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

['dist', 'public'].forEach(outDirName => {
  const outDir = path.join(__dirname, outDirName);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }

  const files = ['index.html', 'lunch-and-learn.html', 'clinical-ecosystem.html', 'classes.html', 'onboarding.html', 'waiver.html', '404.html', 'mockup-landing.html', 'funnel.html', 'results.html', 'profile.html', 'survey.html', 'approach.html', 'how-to-use.html', 'rebuilding-life-challenges.html', 'employment-challenges.html', 'personos-prompt.html', 'style.css', 'tailwind.css', 'script.js', 'bot-shield.js', 'hope-survey.html', 'manifest.webmanifest', 'favicon.svg', 'favicon-32x32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'ai-avatar.png', 'minds-eye.png', 'minds-eye-animated.mp4', 'minds-eye-animated.webm', 'minds-eye-white-bg.mp4'];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(outDir, file));
    }
  });
  if (fs.existsSync('funnel.html')) {
    fs.copyFileSync('funnel.html', path.join(outDir, 'landingpage.html'));
  }
  EXCLUDED_ROOT_FILES.forEach(file => removeIfExists(path.join(outDir, file)));

  const assetsDirSrc = path.join(__dirname, 'assets');
  const assetsDirDest = path.join(outDir, 'assets');
  if (fs.existsSync(assetsDirSrc)) {
    if (!fs.existsSync(assetsDirDest)) {
      fs.mkdirSync(assetsDirDest);
    }
    fs.readdirSync(assetsDirSrc).forEach(file => {
      if (EXCLUDED_ASSETS.has(file)) return;
      fs.copyFileSync(path.join(assetsDirSrc, file), path.join(assetsDirDest, file));
    });
    EXCLUDED_ASSETS.forEach(file => removeIfExists(path.join(assetsDirDest, file)));
  }

  const publicDocsFiles = ['learnworlds-troubleshooting.md'];
  const docsDirSrc = path.join(__dirname, 'docs');
  const docsDirDest = path.join(outDir, 'docs');
  if (fs.existsSync(docsDirSrc)) {
    if (!fs.existsSync(docsDirDest)) {
      fs.mkdirSync(docsDirDest, { recursive: true });
    }
    publicDocsFiles.forEach(docFile => {
      const srcPath = path.join(docsDirSrc, docFile);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(docsDirDest, docFile));
      }
    });
  }

  const REVOKED_KEYS = new Set([
    "AIzaSyDhByu-gVi8PNLtDdl41ETxOmu2JOEVt8A",
    "sk_d2fc2ac281afdb8a56178f44c8ebca76f21da62f7a256bf8"
  ]);
  const hasActiveServerKey = (val) => {
    const trimmed = String(val || "").trim();
    return Boolean(trimmed && !REVOKED_KEYS.has(trimmed));
  };

  // Never inject raw secret keys into public HTML; only emit a non-secret proxy token when a valid server key exists.
  const elevenLabsToken = hasActiveServerKey(process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY || "") ? "__SERVER_PROXY__" : "";
  const geminiToken = hasActiveServerKey(process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "") ? "__SERVER_PROXY__" : "";

  ['profile.html', 'survey.html', 'hope-survey.html'].forEach(file => {
    const filePath = path.join(outDir, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/%VITE_ELEVENLABS_API_KEY%/g, elevenLabsToken);
      content = content.replace(/%VITE_GEMINI_API_KEY%/g, geminiToken);
      fs.writeFileSync(filePath, content);
    }
  });

  // Stamp content-hash cache busters on style.css and script.js across all built HTML pages
  // so mobile browsers and in-app webviews never serve stale CSS/JS after deployments.
  fs.readdirSync(outDir).filter(f => f.endsWith('.html')).forEach(htmlFile => {
    const htmlPath = path.join(outDir, htmlFile);
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace(/href="style\.css(?:\?v=[^"]*)?"/g, `href="style.css?v=${cssHash}"`);
    html = html.replace(/src="script\.js(?:\?v=[^"]*)?"/g, `src="script.js?v=${jsHash}"`);
    html = html.replace(/src="bot-shield\.js(?:\?v=[^"]*)?"/g, `src="bot-shield.js?v=${shieldJsHash}"`);
    fs.writeFileSync(htmlPath, html);
  });
});

console.log("Build complete. Output generated in both dist/ and public/ to guarantee Vercel compatibility.");