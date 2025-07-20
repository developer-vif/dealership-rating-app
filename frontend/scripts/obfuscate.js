const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Obfuscation configuration optimized for production
const obfuscationOptions = {
  // Control flow
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  
  // Dead code injection
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  
  // Debug protection
  debugProtection: true,
  debugProtectionInterval: 2000,
  disableConsoleOutput: true,
  
  // Identifier names
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false, // Keep false to prevent breaking React/DOM globals
  
  // String encryption
  stringArray: true,
  stringArrayThreshold: 0.75,
  stringArrayEncoding: ['base64'],
  stringArrayRotate: true,
  stringArrayShuffle: true,
  
  // Code transformation
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  
  // Performance optimizations
  compact: true,
  numbersToExpressions: true,
  simplify: true,
  
  // Prevent breaking functionality
  reservedNames: [
    // React/DOM globals
    'React', 'ReactDOM', 'window', 'document', 'console',
    // Google APIs
    'google', 'gapi', 'grecaptcha',
    // Common globals that should not be renamed
    'process', 'require', 'module', 'exports', '__dirname', '__filename',
    // Material-UI/Emotion related
    'emotion', 'mui',
    // Specific to our app
    'REACT_APP_*'
  ],
  
  // Source map
  sourceMap: false,
  sourceMapMode: 'separate',
  
  // Target environment
  target: 'browser'
};

// Function to obfuscate a single file
function obfuscateFile(filePath) {
  try {
    console.log(`Obfuscating: ${filePath}`);
    
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    
    // Skip very small files (likely just imports/exports)
    if (sourceCode.length < 100) {
      console.log(`Skipping small file: ${filePath}`);
      return;
    }
    
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(sourceCode, obfuscationOptions);
    
    // Write obfuscated code back to file
    fs.writeFileSync(filePath, obfuscatedCode.getObfuscatedCode());
    
    console.log(`✅ Successfully obfuscated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error obfuscating ${filePath}:`, error.message);
    // Continue with other files even if one fails
  }
}

// Main obfuscation process
function obfuscateBuild() {
  const buildDir = path.join(__dirname, '../build');
  
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found. Please run "npm run build" first.');
    process.exit(1);
  }
  
  console.log('🔒 Starting JavaScript obfuscation...');
  console.log(`📁 Build directory: ${buildDir}`);
  
  // Find all JavaScript files in the build directory
  const jsFiles = glob.sync('**/*.js', {
    cwd: buildDir,
    absolute: true,
    ignore: [
      '**/*.map', // Skip source maps
      '**/service-worker.js', // Skip service worker (might break functionality)
      '**/workbox-*.js' // Skip workbox files
    ]
  });
  
  console.log(`📦 Found ${jsFiles.length} JavaScript files to obfuscate`);
  
  if (jsFiles.length === 0) {
    console.log('⚠️  No JavaScript files found to obfuscate');
    return;
  }
  
  // Obfuscate each file
  jsFiles.forEach(obfuscateFile);
  
  console.log('✨ JavaScript obfuscation completed!');
  console.log('');
  console.log('🔐 Security measures applied:');
  console.log('  ✅ Source maps disabled');
  console.log('  ✅ Code obfuscated with string encryption');
  console.log('  ✅ Control flow flattening applied');
  console.log('  ✅ Dead code injection added');
  console.log('  ✅ Debug protection enabled');
  console.log('  ✅ Console output disabled in production');
  console.log('');
  console.log('⚡ Build is ready for production deployment!');
}

// Add glob as a dependency check
try {
  require.resolve('glob');
} catch (error) {
  console.error('❌ Missing dependency: glob');
  console.log('Installing glob...');
  require('child_process').execSync('npm install --save-dev glob', { stdio: 'inherit' });
}

// Run the obfuscation
obfuscateBuild();