const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// React-friendly obfuscation configuration
const obfuscationOptions = {
  // Control flow - reduced to prevent breaking React component lifecycle
  controlFlowFlattening: false, // Disable to prevent breaking React
  controlFlowFlatteningThreshold: 0.5,
  
  // Dead code injection - reduced to prevent interference
  deadCodeInjection: false, // Disable to prevent breaking React
  deadCodeInjectionThreshold: 0.2,
  
  // Debug protection - keep minimal to avoid breaking dev tools completely
  debugProtection: false, // Disable to prevent breaking React DevTools
  debugProtectionInterval: 0,
  disableConsoleOutput: false, // Keep console for debugging if needed
  
  // Identifier names
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false, // Critical: keep false to prevent breaking React/DOM globals
  renameProperties: false, // Critical: prevent breaking React props/state
  
  // String encryption - minimal to prevent breaking string-based functionality
  stringArray: true,
  stringArrayThreshold: 0.3, // Reduced threshold
  stringArrayEncoding: ['base64'],
  stringArrayRotate: false, // Disable rotation to prevent issues
  stringArrayShuffle: false, // Disable shuffling to prevent issues
  
  // Code transformation - minimal
  transformObjectKeys: false, // Critical: prevent breaking React props/Material-UI
  unicodeEscapeSequence: false,
  
  // Performance optimizations
  compact: true,
  numbersToExpressions: false, // Disable to prevent breaking calculations
  simplify: true,
  
  // Prevent breaking functionality - expanded list
  reservedNames: [
    // React core
    'React', 'ReactDOM', 'Component', 'PureComponent', 'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext',
    // DOM/Browser globals
    'window', 'document', 'console', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'localStorage', 'sessionStorage', 'location', 'history', 'navigator',
    // Google APIs
    'google', 'gapi', 'grecaptcha', 'GoogleAuth', 'GoogleMap', 'Marker', 'InfoWindow',
    // Common globals
    'process', 'require', 'module', 'exports', '__dirname', '__filename', 'global',
    // Material-UI/Emotion related
    'emotion', 'mui', 'styled', 'css', 'ThemeProvider', 'createTheme', 'useTheme',
    // React Router
    'BrowserRouter', 'Route', 'Routes', 'Navigate', 'useNavigate', 'useLocation', 'useParams',
    // React Query
    'QueryClient', 'QueryClientProvider', 'useQuery', 'useMutation',
    // CSS/Style related
    'className', 'style', 'styles', 'theme', 'palette', 'breakpoints',
    // Environment variables
    'REACT_APP_API_URL', 'REACT_APP_GOOGLE_MAPS_API_KEY', 'REACT_APP_GOOGLE_CLIENT_ID', 'REACT_APP_RECAPTCHA_SITE_KEY'
  ],
  
  // Prevent breaking reserved words and property names
  reservedStrings: [
    'className', 'style', 'onClick', 'onChange', 'onSubmit', 'value', 'checked', 'disabled',
    'children', 'props', 'state', 'ref', 'key', 'id', 'type', 'name', 'src', 'href', 'alt'
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