import os, shutil

out_dirs = ['dist', 'public']
files = ['index.html', 'mockup-landing.html', 'funnel.html', 'results.html', 'profile.html', 'survey.html', 'approach.html', 'how-to-use.html', 'rebuilding-life-challenges.html', 'employment-challenges.html', 'style.css', 'script.js', 'hope-survey.html', 'manifest.webmanifest', 'favicon.svg', 'favicon-32x32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'ai-avatar.png', 'minds-eye.png', 'minds-eye-animated.mp4', 'minds-eye-animated.webm']

# Archival design files kept in the repo but never referenced by any page.
# They are skipped during the build (and any stale copies are removed from the output).
excluded_root_files = {'minds-eye-white-bg.mp4'}
excluded_assets = {
    '.DS_Store',
    'Hero Page.png',
    'Hero Page (1).png',
    'THRiVECoaching Hero img.jpeg',
    'hope_index_visual.png',
    'map_mockup.png',
    'sol-meadow-bg.jpg',
    'avatar-placeholder.png',
    'Slide1.PNG', 'Slide2.PNG', 'Slide3.PNG', 'Slide4.PNG', 'Slide5.PNG',
    'Slide6.PNG', 'Slide7.PNG', 'Slide8.PNG', 'Slide9.PNG',
}


def remove_if_exists(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)


for out_dir in out_dirs:
    os.makedirs(out_dir, exist_ok=True)
    for file in files:
        if os.path.exists(file):
            shutil.copy2(file, os.path.join(out_dir, file))
    if os.path.exists('funnel.html'):
        shutil.copy2('funnel.html', os.path.join(out_dir, 'landingpage.html'))
    for file in excluded_root_files:
        remove_if_exists(os.path.join(out_dir, file))
    
    assets_src = 'assets'
    assets_dest = os.path.join(out_dir, 'assets')
    if os.path.exists(assets_src):
        os.makedirs(assets_dest, exist_ok=True)
        for asset in os.listdir(assets_src):
            if asset in excluded_assets:
                continue
            shutil.copy2(os.path.join(assets_src, asset), os.path.join(assets_dest, asset))
        for asset in excluded_assets:
            remove_if_exists(os.path.join(assets_dest, asset))

    revoked_keys = {
        "AIzaSyDhByu-gVi8PNLtDdl41ETxOmu2JOEVt8A",
        "sk_d2fc2ac281afdb8a56178f44c8ebca76f21da62f7a256bf8",
    }
    raw_el_key = os.environ.get('VITE_ELEVENLABS_API_KEY', os.environ.get('ELEVENLABS_API_KEY', '')).strip()
    raw_gem_key = os.environ.get('VITE_GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY', '')).strip()
    el_token = '__SERVER_PROXY__' if (raw_el_key and raw_el_key not in revoked_keys) else ''
    gem_token = '__SERVER_PROXY__' if (raw_gem_key and raw_gem_key not in revoked_keys) else ''

    for file in ['profile.html', 'survey.html', 'hope-survey.html']:
        file_path = os.path.join(out_dir, file)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf8', newline='') as f:
                content = f.read()
            content = content.replace('%VITE_ELEVENLABS_API_KEY%', el_token)
            content = content.replace('%VITE_GEMINI_API_KEY%', gem_token)
            with open(file_path, 'w', encoding='utf8', newline='') as f:
                f.write(content)

print("Build complete.")
