const fs = require('fs');
const { execSync } = require('child_process');

try {
  const sql = fs.readFileSync('migration_logic_adjustments.sql', 'utf8');
  
  // Remove comments and split by semicolon
  const statements = sql
    .replace(/--.*$/gm, '')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
    console.log(stmt.substring(0, 50) + (stmt.length > 50 ? '...' : ''));
    
    try {
      // Escape single quotes and newlines for bash
      const cmd = `npx -y @insforge/cli db query "${stmt.replace(/"/g, '\\"')}"`;
      const output = execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
      console.log('SUCCESS');
    } catch (e) {
      console.error('ERROR executing query:');
      console.error(e.stdout || e.message);
      process.exit(1);
    }
  }
  
  console.log('\nAll migrations applied successfully!');
} catch (err) {
  console.error(err);
  process.exit(1);
}
