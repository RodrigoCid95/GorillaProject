var n=require("gorilla/core"),r=require("gorilla/http");(async function(){let o=require("path"),a=o.resolve(__dirname,".."),e=o.resolve(__dirname,"."),l=o.join(e,"configProfiles"),t=new n.ConfigManager(require(l).default),c=o.join(e,"libs"),g=require(c),s=new n.LibraryManager(t,g);await s.build(i=>console.log(i));let m=o.join(e,"models"),f=require(m),d=new n.ModelsManager(f,s);(0,r.initHttpServer)({returnInstance:!1,mm:d,distDir:e,mainDir:a,gorillaHttpConfig:t.getConfig("gorillaHttpConfig"),onMessage:i=>console.log(i)})})();