import os

input_file = "THRIVE Profile.html"
output_file = "profile.html"

with open(input_file, "r") as f:
    content = f.read()

# Transformations
content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "const { useState, useEffect, useRef } = React;")
content = content.replace("export default function App()", "function App()")

html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>THRiVE Profile</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col relative">
    <nav class="absolute top-6 left-6 z-50 print:hidden">
        <a href="index.html" class="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold transition-all no-underline">
            &larr; Back to Home
        </a>
    </nav>
    <div id="root"></div>
    <script type="text/babel">
{content}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
    </script>
</body>
</html>
"""

with open(output_file, "w") as f:
    f.write(html_template)

os.remove(input_file)
print("Successfully created profile.html")
