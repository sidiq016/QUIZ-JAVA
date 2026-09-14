const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const syncRoutes = `
app.post("/api/users-sync", (req, res) => {
  const user = req.body;
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  res.json({ success: true });
});

app.post("/api/modules-sync", (req, res) => {
  const mod = req.body;
  const idx = modules.findIndex(m => m.id === mod.id);
  if (idx >= 0) modules[idx] = mod;
  else modules.push(mod);
  res.json({ success: true });
});

app.post("/api/results-sync", (req, res) => {
  const resData = req.body;
  const idx = results.findIndex(r => r.id === resData.id);
  if (idx >= 0) results[idx] = resData;
  else results.push(resData);
  res.json({ success: true });
});
`;

if (!code.includes('/api/users-sync')) {
  code = code.replace('// Student Actions', syncRoutes + '\n// Student Actions');
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts");
} else {
  console.log("Already patched");
}
