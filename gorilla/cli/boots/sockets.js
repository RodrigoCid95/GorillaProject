var o=require("gorilla/core"),t=require("gorilla/web-sockets");(async function(){let n=require("path"),e=n.resolve(__dirname,"."),c=n.join(e,"configProfiles"),r=new o.ConfigManager(require(c).default),a=n.join(e,"libs"),l=require(a),i=new o.LibraryManager(r,l);await i.build(s=>console.log(s));let g=n.join(e,"models"),m=require(g),f=new o.ModelsManager(m,i);(0,t.initSocketsServer)({mm:f,lm:i,distDir:e,gorilaSocketsConfig:r.getConfig("gorilaSocketsConfig"),onError:s=>console.error(s)})})();