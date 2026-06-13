import os, shutil

out_dirs = ['dist', 'public']
files = ['index.html', 'profile.html', 'survey.html', 'approach.html', 'how-to-use.html', 'rebuilding-life-challenges.html', 'employment-challenges.html', 'style.css', 'script.js', 'hope-survey.html', 'minds-eye-white-bg.mp4', 'minds-eye.png', 'minds-eye-animated.mp4', 'minds-eye-animated.webm']

for out_dir in out_dirs:
    os.makedirs(out_dir, exist_ok=True)
    for file in files:
        if os.path.exists(file):
            shutil.copy2(file, os.path.join(out_dir, file))
    
    assets_src = 'assets'
    assets_dest = os.path.join(out_dir, 'assets')
    if os.path.exists(assets_src):
        os.makedirs(assets_dest, exist_ok=True)
        for asset in os.listdir(assets_src):
            shutil.copy2(os.path.join(assets_src, asset), os.path.join(assets_dest, asset))

    key = os.environ.get('VITE_ELEVENLABS_API_KEY', os.environ.get('ELEVENLABS_API_KEY', ''))
    gemini_key = os.environ.get('VITE_GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY', ''))

    for file in ['profile.html', 'survey.html', 'hope-survey.html']:
        file_path = os.path.join(out_dir, file)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf8') as f:
                content = f.read()
            content = content.replace('%VITE_ELEVENLABS_API_KEY%', key)
            content = content.replace('%VITE_GEMINI_API_KEY%', gemini_key)
            with open(file_path, 'w', encoding='utf8') as f:
                f.write(content)

print("Build complete.")
