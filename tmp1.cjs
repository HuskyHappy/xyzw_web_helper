const fs=require('fs'); const f='src/views/Dashboard.vue'; const c=fs.readFileSync(f,'utf8'); fs.writeFileSync('D:/db/Github/APP/cheshi/tmp_dash.txt',c); console.log(c.length);
