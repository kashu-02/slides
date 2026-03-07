#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const EXCLUDED_DIRS = ['.github', 'scripts', 'node_modules', 'dist', 'result'];
const DIST_DIR = 'dist';

// Helper function to execute shell commands
function exec(command, options = {}) {
  console.log(`> ${command}`);
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'inherit', ...options });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    throw error;
  }
}

// Check if a presentation is marked as unlisted
function isUnlisted(dir) {
  // Method 1: Check for .unlisted file
  const unlistedFile = path.join(dir, '.unlisted');
  if (fs.existsSync(unlistedFile)) {
    console.log(`  ⊘ Presentation is unlisted (via .unlisted file)`);
    return true;
  }

  // Method 2: Check frontmatter in slide.md
  const slideFile = path.join(dir, 'slide.md');
  const content = fs.readFileSync(slideFile, 'utf8');

  // Simple frontmatter parser for YAML between --- delimiters
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    if (frontmatter.includes('unlisted: true') || frontmatter.includes('unlisted:true')) {
      console.log(`  ⊘ Presentation is unlisted (via frontmatter)`);
      return true;
    }
  }

  return false;
}

// Extract title from slide.md (first h1 heading after frontmatter)
function extractTitle(dir) {
  const slideFile = path.join(dir, 'slide.md');
  const content = fs.readFileSync(slideFile, 'utf8');

  // Remove frontmatter if present
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Find first h1 heading
  const h1Match = withoutFrontmatter.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  return dir; // Fallback to directory name
}

// Discover all presentation directories
function discoverPresentations() {
  console.log('Discovering presentations...\n');

  const presentations = fs.readdirSync('.')
    .filter(file => {
      // Skip hidden directories
      if (file.startsWith('.')) return false;

      // Skip excluded system directories
      if (EXCLUDED_DIRS.includes(file)) return false;

      // Only include directories
      if (!fs.statSync(file).isDirectory()) return false;

      // Must contain slide.md
      return fs.existsSync(path.join(file, 'slide.md'));
    });

  console.log(`Found ${presentations.length} presentation(s):\n`);
  presentations.forEach(p => console.log(`  - ${p}`));
  console.log();

  return presentations;
}

// Build a single presentation
function buildPresentation(dir) {
  console.log(`\nBuilding: ${dir}`);
  console.log('─'.repeat(50));

  const outputDir = path.join(DIST_DIR, dir);
  const slideFile = path.join(dir, 'slide.md');
  const htmlOutput = path.join(outputDir, 'index.html');
  const pdfOutput = path.join(outputDir, 'slide.pdf');

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  // Check if unlisted
  const unlisted = isUnlisted(dir);

  // Build HTML
  console.log('  Building HTML...');
  exec(`npx @marp-team/marp-cli ${slideFile} -o ${htmlOutput} --html allow-local-files`);

  // Build PDF
  console.log('  Building PDF...');
  exec(`npx @marp-team/marp-cli ${slideFile} -o ${pdfOutput} --pdf --allow-local-files`);

  // Copy assets (fig directory if it exists)
  const figDir = path.join(dir, 'fig');
  if (fs.existsSync(figDir)) {
    console.log('  Copying assets (fig/)...');
    const outputFigDir = path.join(outputDir, 'fig');
    fs.mkdirSync(outputFigDir, { recursive: true });

    // Copy all files from fig to output fig
    const files = fs.readdirSync(figDir);
    files.forEach(file => {
      fs.copyFileSync(
        path.join(figDir, file),
        path.join(outputFigDir, file)
      );
    });
  }

  console.log('  ✓ Build complete');

  return { dir, unlisted };
}

// Generate landing page
function generateLandingPage(presentations) {
  console.log('\nGenerating landing page...');

  const listedPresentations = presentations.filter(p => !p.unlisted);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marp Presentations</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 3rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      color: #667eea;
    }

    .subtitle {
      color: #666;
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }

    .presentations {
      list-style: none;
    }

    .presentation-item {
      margin-bottom: 1.5rem;
      padding: 1.5rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .presentation-item:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
      transform: translateY(-2px);
    }

    .presentation-name {
      font-size: 1.3rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .presentation-title {
      color: #666;
      margin-bottom: 0.8rem;
      font-size: 0.95rem;
    }

    .presentation-links {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .presentation-links a {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.9rem;
      transition: background 0.2s;
    }

    .presentation-links a:hover {
      background: #5568d3;
    }

    .presentation-links a.pdf {
      background: #e74c3c;
    }

    .presentation-links a.pdf:hover {
      background: #c0392b;
    }

    footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #999;
      font-size: 0.9rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Presentations</h1>
    <p class="subtitle">Marp slide presentations built with CI/CD</p>

    ${listedPresentations.length > 0 ? `
    <ul class="presentations">
      ${listedPresentations.map(p => {
        const title = extractTitle(p.dir);
        return `
      <li class="presentation-item">
        <div class="presentation-name">${p.dir}</div>
        <div class="presentation-title">${title !== p.dir ? title : ''}</div>
        <div class="presentation-links">
          <a href="${p.dir}/">View Slides</a>
          <a href="${p.dir}/slide.pdf" class="pdf">Download PDF</a>
        </div>
      </li>`;
      }).join('\n      ')}
    </ul>
    ` : `
    <div class="empty-state">
      <p>No presentations available yet.</p>
    </div>
    `}

    <footer>
      Built with <a href="https://marp.app/" style="color: #667eea;">Marp</a> •
      Deployed on <a href="https://pages.cloudflare.com/" style="color: #667eea;">Cloudflare Pages</a>
    </footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);

  console.log(`  ✓ Landing page generated (${listedPresentations.length} listed presentation(s))`);
  if (presentations.length > listedPresentations.length) {
    const unlistedCount = presentations.length - listedPresentations.length;
    console.log(`  ⊘ ${unlistedCount} unlisted presentation(s) excluded from index`);
  }
}

// Main build function
function main() {
  console.log('\n' + '='.repeat(50));
  console.log('Building Marp Presentations');
  console.log('='.repeat(50) + '\n');

  // Clean dist directory
  if (fs.existsSync(DIST_DIR)) {
    console.log('Cleaning dist directory...\n');
    fs.rmSync(DIST_DIR, { recursive: true });
  }

  // Discover presentations
  const dirs = discoverPresentations();

  if (dirs.length === 0) {
    console.log('No presentations found. Exiting.');
    process.exit(0);
  }

  // Build all presentations
  const presentations = dirs.map(dir => buildPresentation(dir));

  // Generate landing page
  generateLandingPage(presentations);

  console.log('\n' + '='.repeat(50));
  console.log('✓ All presentations built successfully!');
  console.log('='.repeat(50) + '\n');
  console.log(`Output directory: ${DIST_DIR}/`);
  console.log(`\nTo preview locally:`);
  console.log(`  cd ${DIST_DIR} && python3 -m http.server 8000`);
  console.log(`  Then open http://localhost:8000\n`);
}

// Run the build
main();
